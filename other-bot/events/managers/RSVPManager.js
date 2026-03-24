class RSVPManager {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.rsvpCooldowns = new Map(); // userId -> timestamp
  }

  checkCooldown(userId) {
    const lastRSVP = this.rsvpCooldowns.get(userId);
    if (lastRSVP) {
      const cooldownMs = 3000; // 3 segundos
      const timeSince = Date.now() - lastRSVP;
      if (timeSince < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - timeSince) / 1000);
        throw new Error(`Debes esperar ${remaining} segundos antes de cambiar tu RSVP nuevamente`);
      }
    }
  }

  handleRSVP(eventId, userId, status, userData = {}) {
    // Verificar cooldown
    this.checkCooldown(userId);

    const event = this.eventManager.getEvent(eventId);
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status !== 'scheduled') {
      throw new Error('No puedes confirmar asistencia a un evento que ya comenzó o fue cancelado');
    }

    // Verificar límite de cambios de RSVP
    const userAttendee = event.attendees.find(a => a.userId === userId);
    if (userAttendee && userAttendee.rsvpChanges >= 10) {
      throw new Error('Has alcanzado el límite de cambios de RSVP para este evento');
    }

    // Remover entrada existente si existe
    event.attendees = event.attendees.filter(a => a.userId !== userId);

    // Si el estado es 'not_attending', simplemente remover
    if (status === 'not_attending') {
      this.rsvpCooldowns.set(userId, Date.now());
      this.eventManager.updateEvent(eventId, { attendees: event.attendees });
      
      // Promover del waitlist si hay espacio
      const promoted = this.promoteFromWaitlist(eventId);
      
      return { success: true, status: 'removed', waitlistPosition: null, promoted: promoted || null };
    }

    // Verificar capacidad para 'attending'
    if (status === 'attending') {
      const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
      const hasCapacity = !event.maxAttendees || attendingCount < event.maxAttendees;

      if (!hasCapacity) {
        // Agregar a waitlist
        status = 'waitlist';
      }
    }

    // Agregar nueva entrada
    const attendee = {
      userId,
      username: userData.username || 'Unknown',
      status,
      timestamp: Date.now(),
      rsvpChanges: (userAttendee?.rsvpChanges || 0) + 1
    };

    event.attendees.push(attendee);

    // Ordenar waitlist por timestamp
    if (status === 'waitlist') {
      event.attendees.sort((a, b) => {
        if (a.status === 'waitlist' && b.status === 'waitlist') {
          return a.timestamp - b.timestamp;
        }
        return 0;
      });
    }

    this.rsvpCooldowns.set(userId, Date.now());
    this.eventManager.updateEvent(eventId, { attendees: event.attendees });

    // Calcular posición en waitlist si aplica
    let waitlistPosition = null;
    if (status === 'waitlist') {
      waitlistPosition = event.attendees
        .filter(a => a.status === 'waitlist')
        .findIndex(a => a.userId === userId) + 1;
    }

    return { 
      success: true, 
      status, 
      waitlistPosition,
      needsRoleAssignment: status === 'attending'
    };
  }

  // Alias para compatibilidad con index.js
  moveFromWaitlist(eventId) {
    return this.promoteFromWaitlist(eventId);
  }

  promoteFromWaitlist(eventId) {
    const event = this.eventManager.getEvent(eventId);
    if (!event) return null;

    const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
    const hasCapacity = !event.maxAttendees || attendingCount < event.maxAttendees;

    if (!hasCapacity) return null;

    // Encontrar primer usuario en waitlist
    const waitlistUsers = event.attendees
      .filter(a => a.status === 'waitlist')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (waitlistUsers.length === 0) return null;

    const promoted = waitlistUsers[0];
    promoted.status = 'attending';
    promoted.promotedAt = Date.now();

    this.eventManager.updateEvent(eventId, { attendees: event.attendees });

    return promoted;
  }

  getAttendees(eventId, status = null) {
    const event = this.eventManager.getEvent(eventId);
    if (!event) return [];

    if (status) {
      return event.attendees.filter(a => a.status === status);
    }

    return event.attendees;
  }

  getWaitlist(eventId) {
    return this.getAttendees(eventId, 'waitlist');
  }

  isUserAttending(eventId, userId) {
    const event = this.eventManager.getEvent(eventId);
    if (!event) return false;

    const attendee = event.attendees.find(a => a.userId === userId);
    return attendee && attendee.status === 'attending';
  }

  getWaitlistPosition(eventId, userId) {
    const waitlist = this.getWaitlist(eventId);
    const index = waitlist.findIndex(a => a.userId === userId);
    return index >= 0 ? index + 1 : null;
  }

  getAttendeeCount(eventId, status = 'attending') {
    return this.getAttendees(eventId, status).length;
  }
}

module.exports = RSVPManager;
