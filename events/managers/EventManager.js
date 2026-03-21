const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class EventManager {
  constructor() {
    this.eventsPath = path.join(__dirname, '../../data/events.json');
    this.configPath = path.join(__dirname, '../../data/event-config.json');
    this.cache = new Map(); // Cache para eventos activos (próximos 7 días)
    this.guildIndex = new Map(); // Índice guildId -> eventIds
    this.userDailyCreations = new Map(); // userId-date -> count (rate limiting)
    this.config = this.loadConfig();
    this.loadEvents();
  }

  // ── Sanitización de inputs ────────────────────────────────────────────────

  sanitizeText(text) {
    if (!text) return text;
    // Filtrar mass mentions
    return text
      .replace(/@everyone/gi, '@\u200beveryone')
      .replace(/@here/gi, '@\u200bhere')
      .replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
  }

  validateImageUrl(url) {
    if (!url) return true;
    const allowedDomains = [
      'cdn.discordapp.com', 'media.discordapp.net', 'i.imgur.com',
      'imgur.com', 'i.ibb.co', 'images.unsplash.com', 'pbs.twimg.com',
      'cdn.pixabay.com', 'upload.wikimedia.org'
    ];
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      return allowedDomains.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }

  // ── Rate limiting por usuario ─────────────────────────────────────────────

  checkUserDailyLimit(userId) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${userId}-${today}`;
    const count = this.userDailyCreations.get(key) || 0;
    const limit = this.config.limits.maxEventsPerUserPerDay || 5;
    if (count >= limit) {
      throw new Error(`Has alcanzado el límite de ${limit} eventos por día`);
    }
    return key;
  }

  incrementUserDailyCount(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${userId}-${today}`;
    this.userDailyCreations.set(key, (this.userDailyCreations.get(key) || 0) + 1);
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading event config:', error);
    }
    // Default config
    return {
      reminders: { enabled: true, intervals: [{ hours: 24 }, { hours: 1 }, { hours: 0 }] },
      limits: { maxEventsPerGuild: 50, maxEventsPerUserPerDay: 5, maxAttendeesPerEvent: 500 }
    };
  }

  loadEvents() {
    try {
      if (fs.existsSync(this.eventsPath)) {
        const data = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
        const now = Date.now();
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

        // Cargar eventos activos en cache
        Object.entries(data.events || {}).forEach(([id, event]) => {
          if (event.startTime >= now && event.startTime <= sevenDaysFromNow) {
            this.cache.set(id, event);
          }
          
          // Construir índice de guild
          if (!this.guildIndex.has(event.guildId)) {
            this.guildIndex.set(event.guildId, new Set());
          }
          this.guildIndex.get(event.guildId).add(id);
        });

        console.log(`✅ Loaded ${this.cache.size} active events into cache`);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Intentar cargar desde backup
      this.loadFromBackup();
    }
  }

  loadFromBackup() {
    const backupPath = this.eventsPath + '.backup';
    try {
      if (fs.existsSync(backupPath)) {
        const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        fs.writeFileSync(this.eventsPath, JSON.stringify(data, null, 2));
        console.log('✅ Restored events from backup');
        this.loadEvents();
      }
    } catch (error) {
      console.error('Error loading from backup:', error);
    }
  }

  saveEvents() {
    try {
      // Crear backup antes de guardar
      if (fs.existsSync(this.eventsPath)) {
        const backupPath = this.eventsPath + '.backup';
        fs.copyFileSync(this.eventsPath, backupPath);
      }

      // Cargar todos los eventos del disco
      let allData = { events: {}, recurrenceTemplates: {} };
      if (fs.existsSync(this.eventsPath)) {
        allData = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      }

      // Actualizar con eventos del cache
      this.cache.forEach((event, id) => {
        allData.events[id] = event;
      });

      fs.writeFileSync(this.eventsPath, JSON.stringify(allData, null, 2));
    } catch (error) {
      console.error('Error saving events:', error);
      throw error;
    }
  }

  validateEventData(data) {
    const errors = [];

    // Validar título
    if (!data.title || data.title.trim().length === 0) {
      errors.push('El título es requerido');
    } else if (data.title.length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }

    // Validar descripción
    if (data.description && data.description.length > 2000) {
      errors.push('La descripción no puede exceder 2000 caracteres');
    }

    // Validar fecha de inicio (solo si se provee, para no romper updates parciales)
    if (data.startTime !== undefined) {
      const now = Date.now();
      const minStartTime = now + (5 * 60 * 1000);
      if (data.startTime < minStartTime) {
        errors.push('La fecha de inicio debe ser al menos 5 minutos en el futuro');
      }
    }

    // Validar fecha de fin
    if (data.endTime && data.endTime <= data.startTime) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar máximo de asistentes
    if (data.maxAttendees !== undefined && data.maxAttendees !== null) {
      if (!Number.isInteger(data.maxAttendees) || data.maxAttendees <= 0) {
        errors.push('El máximo de asistentes debe ser un número entero positivo');
      }
    }

    // Validar URL de imagen (solo HTTPS y dominios permitidos)
    if (data.imageUrl && !this.validateImageUrl(data.imageUrl)) {
      errors.push('La URL de imagen debe usar HTTPS y ser de un dominio permitido (imgur, Discord CDN, etc.)');
    }

    // Validar patrón de recurrencia
    if (data.recurrence) {
      if (!Number.isInteger(data.recurrence.interval) || data.recurrence.interval < 1) {
        errors.push('El intervalo de recurrencia debe ser un número entero mayor o igual a 1');
      }
      if (data.recurrence.daysOfWeek) {
        const validDays = data.recurrence.daysOfWeek.every(day => 
          Number.isInteger(day) && day >= 0 && day <= 6
        );
        if (!validDays) {
          errors.push('Los días de la semana deben ser números entre 0 y 6');
        }
      }
    }

    return errors;
  }

  createEvent(eventData) {
    // Sanitizar inputs
    if (eventData.title) eventData.title = this.sanitizeText(eventData.title);
    if (eventData.description) eventData.description = this.sanitizeText(eventData.description);
    if (eventData.location) eventData.location = this.sanitizeText(eventData.location);

    // Validar datos
    const errors = this.validateEventData(eventData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Verificar rate limit diario del usuario
    const rateLimitKey = this.checkUserDailyLimit(eventData.creatorId);

    // Verificar límite de eventos activos del guild
    const guildEvents = this.getGuildEvents(eventData.guildId, { status: 'scheduled' });
    if (guildEvents.length >= this.config.limits.maxEventsPerGuild) {
      throw new Error(`El servidor ha alcanzado el límite de ${this.config.limits.maxEventsPerGuild} eventos activos`);
    }

    // Crear evento
    const event = {
      id: uuidv4(),
      ...eventData,
      status: 'scheduled',
      attendees: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Guardar en cache y disco
    this.cache.set(event.id, event);
    
    // Actualizar índice de guild
    if (!this.guildIndex.has(event.guildId)) {
      this.guildIndex.set(event.guildId, new Set());
    }
    this.guildIndex.get(event.guildId).add(event.id);

    this.saveEvents();

    // Crear template de recurrencia si aplica
    if (event.recurrence) {
      this.createRecurrenceTemplate(event);
    }

    // Registrar creación para rate limiting
    this.incrementUserDailyCount(eventData.creatorId);

    return event;
  }

  getEvent(eventId) {
    // Buscar en cache primero
    if (this.cache.has(eventId)) {
      return this.cache.get(eventId);
    }

    // Buscar en disco
    try {
      const data = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      return data.events[eventId] || null;
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  getGuildEvents(guildId, filters = {}) {
    const eventIds = this.guildIndex.get(guildId) || new Set();
    let events = [];

    // Obtener eventos del guild
    eventIds.forEach(id => {
      const event = this.getEvent(id);
      if (event) {
        events.push(event);
      }
    });

    // Aplicar filtros
    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters.startDate && filters.endDate) {
      events = events.filter(e => 
        e.startTime >= filters.startDate && e.startTime <= filters.endDate
      );
    }

    if (filters.creatorId) {
      events = events.filter(e => e.creatorId === filters.creatorId);
    }

    // Ordenar por fecha de inicio
    events.sort((a, b) => a.startTime - b.startTime);

    return events;
  }

  getUpcomingEvents(guildId, timeWindow = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const endTime = now + timeWindow;

    return this.getGuildEvents(guildId, {
      status: 'scheduled',
      startDate: now,
      endDate: endTime
    });
  }

  updateEvent(eventId, updates) {
    const event = this.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Solo validar startTime si se está actualizando explícitamente
    const updatedEvent = { ...event, ...updates };
    if (!('startTime' in updates)) {
      delete updatedEvent.startTime; // evitar que la validación rechace el startTime original
    }
    const errors = this.validateEventData(updatedEvent);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Aplicar actualizaciones
    Object.assign(event, updates);
    event.updatedAt = Date.now();

    // Actualizar cache
    this.cache.set(eventId, event);
    this.saveEvents();

    return event;
  }

  deleteEvent(eventId) {
    const event = this.getEvent(eventId);
    if (!event) {
      return false;
    }

    // Marcar como cancelado en lugar de eliminar
    event.status = 'cancelled';
    event.updatedAt = Date.now();

    this.cache.set(eventId, event);
    this.saveEvents();

    return true;
  }

  transitionEventStatus(eventId, newStatus) {
    const event = this.getEvent(eventId);
    if (!event) {
      return false;
    }

    // Validar transiciones válidas
    const validTransitions = {
      'scheduled': ['ongoing', 'cancelled'],
      'ongoing': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[event.status].includes(newStatus)) {
      throw new Error(`Transición inválida de ${event.status} a ${newStatus}`);
    }

    event.status = newStatus;
    event.updatedAt = Date.now();

    this.cache.set(eventId, event);
    this.saveEvents();

    return true;
  }

  checkAndUpdateEventStatuses() {
    const now = Date.now();
    let updated = 0;

    this.cache.forEach((event, id) => {
      try {
        if (event.status === 'scheduled' && event.startTime <= now) {
          this.transitionEventStatus(id, 'ongoing');
          updated++;
        } else if (event.status === 'ongoing' && event.endTime && event.endTime <= now) {
          this.transitionEventStatus(id, 'completed');
          // Notify stats tracker with updated event
          if (this.onEventCompleted) {
            const completedEvent = this.getEvent(id);
            this.onEventCompleted(completedEvent || event);
          }
          updated++;
        }
      } catch (error) {
        console.error(`Error updating event ${id} status:`, error);
      }
    });

    if (updated > 0) console.log(`✅ Updated ${updated} event statuses`);
    return updated;
  }

  // ── Recurring events ──────────────────────────────────────────────────────

  loadRecurrenceTemplates() {
    try {
      const data = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      return data.recurrenceTemplates || {};
    } catch {
      return {};
    }
  }

  saveRecurrenceTemplate(template) {
    try {
      let allData = { events: {}, recurrenceTemplates: {} };
      if (fs.existsSync(this.eventsPath)) {
        allData = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      }
      allData.recurrenceTemplates[template.id] = template;
      fs.writeFileSync(this.eventsPath, JSON.stringify(allData, null, 2));
    } catch (error) {
      console.error('Error saving recurrence template:', error);
    }
  }

  deleteRecurrenceTemplate(templateId) {
    try {
      let allData = { events: {}, recurrenceTemplates: {} };
      if (fs.existsSync(this.eventsPath)) {
        allData = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      }
      delete allData.recurrenceTemplates[templateId];
      fs.writeFileSync(this.eventsPath, JSON.stringify(allData, null, 2));
    } catch (error) {
      console.error('Error deleting recurrence template:', error);
    }
  }

  calculateNextOccurrence(currentDate, pattern) {
    const next = new Date(currentDate);

    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7 * pattern.interval);
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          let attempts = 0;
          while (!pattern.daysOfWeek.includes(next.getDay()) && attempts < 7) {
            next.setDate(next.getDate() + 1);
            attempts++;
          }
        }
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval);
        break;
    }

    return next.getTime();
  }

  async generateRecurringEvents() {
    const now = Date.now();
    const templates = this.loadRecurrenceTemplates();
    let generated = 0;

    for (const template of Object.values(templates)) {
      if (template.nextOccurrence > now) continue;

      const pattern = template.baseEventData.recurrence;

      // Check endDate
      if (pattern.endDate && template.nextOccurrence > new Date(pattern.endDate).getTime()) {
        this.deleteRecurrenceTemplate(template.id);
        continue;
      }

      // Calculate duration
      const duration = template.baseEventData.endTime
        ? new Date(template.baseEventData.endTime).getTime() - new Date(template.baseEventData.startTime).getTime()
        : null;

      const newStartTime = template.nextOccurrence;
      const eventData = {
        ...template.baseEventData,
        startTime: newStartTime,
        endTime: duration ? newStartTime + duration : undefined
      };

      try {
        this.createEvent(eventData);
        generated++;
      } catch (error) {
        console.error('Error generating recurring event:', error);
      }

      // Update template's next occurrence
      template.nextOccurrence = this.calculateNextOccurrence(template.nextOccurrence, pattern);
      template.lastGenerated = now;
      this.saveRecurrenceTemplate(template);
    }

    if (generated > 0) console.log(`✅ Generated ${generated} recurring events`);
    return generated;
  }

  createRecurrenceTemplate(event) {
    const template = {
      id: uuidv4(),
      guildId: event.guildId,
      baseEventData: {
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        maxAttendees: event.maxAttendees,
        roleId: event.roleId,
        imageUrl: event.imageUrl,
        recurrence: event.recurrence,
        guildId: event.guildId,
        channelId: event.channelId,
        creatorId: event.creatorId,
        creatorUsername: event.creatorUsername
      },
      nextOccurrence: this.calculateNextOccurrence(event.startTime, event.recurrence),
      lastGenerated: Date.now()
    };

    this.saveRecurrenceTemplate(template);
    return template;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  cleanupOldEvents() {
    const cleanup = this.config.cleanup || {};
    const completedRetention = (cleanup.completedEventsRetentionDays || 30) * 24 * 60 * 60 * 1000;
    const cancelledRetention = (cleanup.cancelledEventsRetentionDays || 7) * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let removed = 0;

    try {
      let allData = { events: {}, recurrenceTemplates: {} };
      if (fs.existsSync(this.eventsPath)) {
        allData = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      }

      for (const [id, event] of Object.entries(allData.events)) {
        const age = now - (event.updatedAt || event.createdAt || 0);
        if (
          (event.status === 'completed' && age > completedRetention) ||
          (event.status === 'cancelled' && age > cancelledRetention)
        ) {
          delete allData.events[id];
          this.cache.delete(id);
          const guildSet = this.guildIndex.get(event.guildId);
          if (guildSet) guildSet.delete(id);
          removed++;
        }
      }

      if (removed > 0) {
        fs.writeFileSync(this.eventsPath, JSON.stringify(allData, null, 2));
        console.log(`✅ Cleaned up ${removed} old events`);
      }
    } catch (error) {
      console.error('Error cleaning up old events:', error);
    }

    return removed;
  }
}

module.exports = EventManager;
