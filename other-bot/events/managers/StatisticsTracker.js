const fs = require('fs');
const path = require('path');

class StatisticsTracker {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.statsPath = path.join(__dirname, '../../data/event-stats.json');
    this.loadStats();
  }

  loadStats() {
    try {
      if (fs.existsSync(this.statsPath)) {
        const data = JSON.parse(fs.readFileSync(this.statsPath, 'utf8'));
        this.userStats = data.userStats || {};
        this.guildStats = data.guildStats || {};
      } else {
        this.userStats = {};
        this.guildStats = {};
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.userStats = {};
      this.guildStats = {};
    }
  }

  saveStats() {
    try {
      const data = {
        userStats: this.userStats,
        guildStats: this.guildStats
      };
      fs.writeFileSync(this.statsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }

  recordAttendance(event) {
    const attendees = event.attendees.filter(a => a.status === 'attending');
    
    attendees.forEach(attendee => {
      const key = `${event.guildId}-${attendee.userId}`;
      
      if (!this.userStats[key]) {
        this.userStats[key] = {
          guildId: event.guildId,
          userId: attendee.userId,
          username: attendee.username,
          eventsAttended: 0,
          eventsCreated: 0,
          totalRSVPs: 0,
          lastEventAt: null
        };
      }

      this.userStats[key].eventsAttended++;
      this.userStats[key].totalRSVPs++;
      this.userStats[key].lastEventAt = event.startTime;
    });

    // Actualizar estadísticas del creador
    const creatorKey = `${event.guildId}-${event.creatorId}`;
    if (!this.userStats[creatorKey]) {
      this.userStats[creatorKey] = {
        guildId: event.guildId,
        userId: event.creatorId,
        username: event.creatorUsername || 'Unknown',
        eventsAttended: 0,
        eventsCreated: 0,
        totalRSVPs: 0,
        lastEventAt: null
      };
    }
    this.userStats[creatorKey].eventsCreated++;

    // Actualizar estadísticas del guild
    if (!this.guildStats[event.guildId]) {
      this.guildStats[event.guildId] = {
        totalEvents: 0,
        totalAttendees: 0,
        averageAttendance: 0,
        mostActiveDay: null,
        mostActiveHour: null
      };
    }

    this.guildStats[event.guildId].totalEvents++;
    this.guildStats[event.guildId].totalAttendees += attendees.length;
    this.guildStats[event.guildId].averageAttendance = 
      this.guildStats[event.guildId].totalAttendees / this.guildStats[event.guildId].totalEvents;

    this.saveStats();
  }

  getUserStats(guildId, userId) {
    const key = `${guildId}-${userId}`;
    const stats = this.userStats[key];

    if (!stats) {
      return {
        eventsAttended: 0,
        eventsCreated: 0,
        attendanceRate: 0,
        totalRSVPs: 0
      };
    }

    const attendanceRate = stats.totalRSVPs > 0 
      ? (stats.eventsAttended / stats.totalRSVPs) * 100 
      : 0;

    return {
      ...stats,
      attendanceRate: Math.round(attendanceRate)
    };
  }

  getGuildStats(guildId) {
    return this.guildStats[guildId] || {
      totalEvents: 0,
      totalAttendees: 0,
      averageAttendance: 0
    };
  }

  getTopAttendees(guildId, limit = 10) {
    const guildUsers = Object.values(this.userStats)
      .filter(stats => stats.guildId === guildId)
      .sort((a, b) => b.eventsAttended - a.eventsAttended)
      .slice(0, limit);

    return guildUsers.map(stats => ({
      userId: stats.userId,
      username: stats.username,
      eventsAttended: stats.eventsAttended,
      eventsCreated: stats.eventsCreated,
      attendanceRate: stats.totalRSVPs > 0 
        ? Math.round((stats.eventsAttended / stats.totalRSVPs) * 100)
        : 0
    }));
  }

  getMostPopularEvents(guildId, limit = 10) {
    const events = this.eventManager.getGuildEvents(guildId, { status: 'completed' });
    
    return events
      .map(event => ({
        id: event.id,
        title: event.title,
        attendeeCount: event.attendees.filter(a => a.status === 'attending').length,
        startTime: event.startTime
      }))
      .sort((a, b) => b.attendeeCount - a.attendeeCount)
      .slice(0, limit);
  }

  getEventStats(eventId) {
    const event = this.eventManager.getEvent(eventId);
    if (!event) return null;

    const totalRSVPs = event.attendees.length;
    const attendedCount = event.attendees.filter(a => a.status === 'attending').length;
    const waitlistCount = event.attendees.filter(a => a.status === 'waitlist').length;
    const attendanceRate = totalRSVPs > 0 ? Math.round((attendedCount / totalRSVPs) * 100) : 0;

    return {
      eventId,
      title: event.title,
      totalRSVPs,
      attendedCount,
      waitlistCount,
      noShowCount: totalRSVPs - attendedCount - waitlistCount,
      attendanceRate,
      status: event.status
    };
  }

  cleanupOldStats() {
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 días
    
    Object.keys(this.userStats).forEach(key => {
      const stats = this.userStats[key];
      if (stats.lastEventAt && stats.lastEventAt < cutoff) {
        delete this.userStats[key];
      }
    });

    this.saveStats();
  }
}

module.exports = StatisticsTracker;
