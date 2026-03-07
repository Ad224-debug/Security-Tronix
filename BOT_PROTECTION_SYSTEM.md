# 🤖 Sistema de Protección de Bots

Sistema de seguridad que controla quién puede agregar bots o aplicaciones al servidor.

## Características

- Solo usuarios autorizados pueden agregar bots
- El dueño del servidor siempre tiene permiso
- Bots no autorizados son expulsados automáticamente
- Notificaciones por DM al usuario que intentó agregar el bot
- Logs detallados de bots agregados (autorizados y no autorizados)
- Sistema puede ser activado/desactivado

## Comandos

### `/botpermission add`
Otorga permiso a un usuario para agregar bots al servidor.

**Permisos requeridos:** Solo el dueño del servidor

**Opciones:**
- `user` - Usuario al que se le dará permiso

**Ejemplo:**
```
/botpermission add user:@Usuario
```

### `/botpermission remove`
Remueve el permiso de un usuario para agregar bots.

**Permisos requeridos:** Solo el dueño del servidor

**Opciones:**
- `user` - Usuario al que se le removerá el permiso

**Nota:** No se puede remover el permiso del dueño del servidor.

**Ejemplo:**
```
/botpermission remove user:@Usuario
```

### `/botpermission list`
Muestra la lista de usuarios que tienen permiso para agregar bots.

**Permisos requeridos:** Solo el dueño del servidor

**Ejemplo:**
```
/botpermission list
```

### `/botpermission enable`
Activa o desactiva el sistema de protección de bots.

**Permisos requeridos:** Solo el dueño del servidor

**Opciones:**
- `enabled` - `True` para activar, `False` para desactivar

**Ejemplo:**
```
/botpermission enable enabled:True
```

## Funcionamiento

### Cuando un bot es agregado:

1. El sistema detecta que un bot se unió al servidor
2. Verifica si el sistema de protección está activado
3. Consulta los audit logs para identificar quién agregó el bot
4. Verifica si el usuario tiene permiso:
   - **Si tiene permiso:** El bot permanece y se registra en logs como "Autorizado"
   - **Si NO tiene permiso:** 
     - El bot es expulsado inmediatamente
     - Se envía un DM al usuario explicando que no tiene permiso
     - Se registra en logs como "Sin Autorización"

### Permisos por defecto:

- El dueño del servidor siempre tiene permiso (no se puede remover)
- Otros usuarios deben ser agregados manualmente con `/botpermission add`

## Logs

El sistema genera logs automáticos en el canal de logs configurado:

### Bot Autorizado (Verde)
```
🤖 Bot Agregado (Autorizado)
🤖 Bot: NombreDelBot#1234
👤 Agregado por: Usuario#5678
✅ Estado: Autorizado
```

### Bot No Autorizado (Rojo)
```
🤖 Bot Expulsado (Sin Autorización)
🤖 Bot: BotMalicioso#9999
👤 Agregado por: UsuarioSinPermiso#1111
❌ Razón: Usuario sin permiso para agregar bots
```

## Notificaciones

Cuando un usuario sin permiso intenta agregar un bot, recibe un DM:

**Español:**
```
❌ No tienes permiso para agregar bots al servidor NombreDelServidor. 
El bot BotName#1234 fue expulsado automáticamente.

Contacta al dueño del servidor si necesitas agregar un bot.
```

**Inglés:**
```
❌ You don't have permission to add bots to ServerName. 
The bot BotName#1234 was automatically kicked.

Contact the server owner if you need to add a bot.
```

## Configuración

El sistema guarda la configuración en `config.json`:

```json
{
  "botPermissions": {
    "GUILD_ID": {
      "enabled": true,
      "allowedUsers": [
        "OWNER_ID",
        "USER_ID_1",
        "USER_ID_2"
      ]
    }
  }
}
```

## Casos de Uso

### Prevenir bots maliciosos
Evita que miembros agreguen bots no autorizados que puedan:
- Hacer spam
- Robar información
- Causar problemas de moderación

### Control centralizado
El dueño del servidor mantiene control total sobre qué bots pueden entrar.

### Servidores grandes
En servidores con muchos administradores, limita quién puede agregar bots.

## Notas Importantes

- El sistema requiere que el bot tenga permiso para ver audit logs
- El bot debe tener permiso para expulsar miembros (Kick Members)
- Si el usuario tiene DMs desactivados, no recibirá la notificación pero el bot será expulsado igual
- El sistema solo afecta a bots, no a usuarios humanos
