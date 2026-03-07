class RoleManager {
  constructor(client) {
    this.client = client;
  }

  async assignEventRole(guild, userId, roleId) {
    try {
      if (!roleId) return { success: false, error: 'No role specified' };

      const member = await guild.members.fetch(userId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      // Verificar permisos del bot
      const botMember = await guild.members.fetch(this.client.user.id);
      if (!botMember.permissions.has('ManageRoles')) {
        return { success: false, error: 'Bot lacks ManageRoles permission' };
      }

      // Verificar jerarquía de roles
      if (role.position >= botMember.roles.highest.position) {
        return { success: false, error: 'Role is higher than bot\'s highest role' };
      }

      // Asignar rol
      await member.roles.add(role);
      return { success: true };
    } catch (error) {
      console.error('Error assigning event role:', error);
      return { success: false, error: error.message };
    }
  }

  async removeEventRole(guild, userId, roleId) {
    try {
      if (!roleId) return { success: false, error: 'No role specified' };

      const member = await guild.members.fetch(userId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        // Si el rol no existe, considerar éxito
        return { success: true };
      }

      // Remover rol
      await member.roles.remove(role);
      return { success: true };
    } catch (error) {
      console.error('Error removing event role:', error);
      return { success: false, error: error.message };
    }
  }

  async removeAllEventRoles(guild, event) {
    const results = [];
    const attendees = event.attendees.filter(a => a.status === 'attending');

    for (const attendee of attendees) {
      const result = await this.removeEventRole(guild, attendee.userId, event.roleId);
      results.push({ userId: attendee.userId, ...result });
    }

    return results;
  }

  async createEventRole(guild, eventName) {
    try {
      const botMember = await guild.members.fetch(this.client.user.id);
      if (!botMember.permissions.has('ManageRoles')) {
        return { success: false, error: 'Bot lacks ManageRoles permission' };
      }

      // Crear rol sin permisos administrativos
      const role = await guild.roles.create({
        name: `Event: ${eventName}`,
        color: 0x3498DB,
        permissions: [],
        mentionable: true,
        reason: 'Event role created by bot'
      });

      // Posicionar el rol debajo del rol más alto del bot
      const position = Math.max(1, botMember.roles.highest.position - 1);
      await role.setPosition(position);

      return { success: true, role };
    } catch (error) {
      console.error('Error creating event role:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteEventRole(guild, roleId) {
    try {
      if (!roleId) return { success: true };

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        return { success: true };
      }

      await role.delete('Event completed or cancelled');
      return { success: true };
    } catch (error) {
      console.error('Error deleting event role:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = RoleManager;
