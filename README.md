# 🤖 VEXOR BOT

Bot de Discord profesional con sistema completo de moderación, eventos, y más.

## 🌟 Características

### Moderación Profesional
- Sistema de casos con IDs únicos
- Advertencias, kicks, bans temporales y permanentes
- Sistema RB3 (Rule Break 3) con strikes automáticos
- Auto-moderación con 6 módulos configurables
- Sistema de reportes con botones interactivos
- Logs detallados de todas las acciones
- Moderación de voz (kick, mute, ban de canales)

### Sistema de Eventos
- Crear y gestionar eventos con RSVP
- Sistema de lista de espera (FIFO)
- Recordatorios automáticos
- Roles automáticos para asistentes
- Estadísticas de eventos

### Seguridad
- Control de permisos por comando
- Sistema de protección de bots
- Filtros de contenido NSFW
- Anti-spam, anti-raid
- Filtro de enlaces e invitaciones

### Utilidades
- Sistema AFK
- Información de usuarios y servidor
- Gestión de roles
- Comandos de diversión (hug, kiss, pat, etc.)
- Sistema de prefijos personalizables
- Soporte multiidioma (ES/EN)

### Notificaciones
- Notificaciones de boost
- Logs de mensajes eliminados/editados
- Logs de miembros (join/leave)
- Logs de roles y canales

## 📋 Requisitos

- Node.js 16.x o superior
- npm o yarn
- Token de bot de Discord
- Application ID de Discord

## 🚀 Instalación Local

1. Clona el repositorio:
```bash
git clone https://github.com/TU_USUARIO/vexor-bot.git
cd vexor-bot
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` con tus credenciales:
```env
DISCORD_TOKEN=tu_token_aqui
APPLICATION_ID=tu_application_id_aqui
```

4. Despliega los comandos:
```bash
npm run deploy
```

5. Inicia el bot:
```bash
npm start
```

## 🚂 Deployment en Railway

Sigue la guía completa en [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

Resumen rápido:
1. Sube el código a GitHub
2. Conecta Railway con tu repositorio
3. Configura las variables de entorno
4. Railway deployará automáticamente

## 📝 Comandos Principales

### Moderación
- `/kick` - Expulsar usuario
- `/ban` - Banear usuario
- `/tempban` - Ban temporal
- `/softban` - Ban y desban inmediato (limpia mensajes)
- `/warn` - Advertir usuario
- `/timeout` - Aislar usuario temporalmente
- `/case` - Ver caso de moderación
- `/history` - Ver historial de moderación
- `/automod` - Configurar auto-moderación
- `/report` - Reportar usuario

### Configuración
- `/modsetup` - Configurar canales de logs
- `/rb3setup` - Configurar sistema de strikes
- `/setcmdpermission` - Permisos por comando
- `/botpermission` - Control de bots
- `/setboostchannel` - Canal de notificaciones de boost

### Eventos
- `/event create` - Crear evento
- `/event list` - Listar eventos
- `/event edit` - Editar evento
- `/event delete` - Eliminar evento
- `/event stats` - Estadísticas

### Utilidades
- `/userinfo` - Información de usuario
- `/serverinfo` - Información del servidor
- `/botinfo` - Información del bot
- `/sync` - Sincronizar comandos
- `/setbotname` - Cambiar nombre del bot
- `/setbotavatar` - Cambiar avatar del bot

### Voz
- `/vcjoin` - Bot se une a canal de voz
- `/vcleave` - Bot sale del canal
- `/vckick` - Expulsar de voz
- `/vcmute` - Mutear en voz
- `/vcban` - Banear de canal de voz

## 🔧 Configuración

El bot crea automáticamente archivos de configuración:
- `config.json` - Configuración general
- `warnings.json` - Advertencias de usuarios
- `warn-config.json` - Configuración de advertencias
- `data/` - Datos de eventos, casos, etc.

## 📚 Documentación

- [Comandos de Moderación](./MODERATION_COMMANDS.md)
- [Sistema Profesional de Moderación](./PROFESSIONAL_MODERATION_SYSTEM.md)
- [Sistemas Avanzados de Moderación](./ADVANCED_MODERATION_SYSTEMS.md)
- [Sistema de Moderación de Voz](./VOICE_MODERATION_SYSTEM.md)
- [Sistema de Protección de Bots](./BOT_PROTECTION_SYSTEM.md)
- [Guía de Permisos de Comandos](./COMMAND_PERMISSIONS_GUIDE.md)
- [Guía de Deployment en Railway](./RAILWAY_DEPLOYMENT_GUIDE.md)

## 🛠️ Tecnologías

- [Discord.js v14](https://discord.js.org/)
- [Node.js](https://nodejs.org/)
- [node-cron](https://www.npmjs.com/package/node-cron) - Tareas programadas
- [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice) - Funcionalidad de voz

## 📊 Estructura del Proyecto

```
vexor-bot/
├── commands/          # Comandos slash
├── events/           # Sistema de eventos
│   ├── managers/     # Gestores de eventos
│   └── utils/        # Utilidades
├── data/             # Datos persistentes
├── automod-system.js # Sistema de auto-moderación
├── rb3-system.js     # Sistema de strikes
├── index.js          # Archivo principal
└── deploy-commands.js # Script de deployment
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

Creado con ❤️ para la comunidad de Discord

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si es posible

## 💡 Soporte

- [Documentación de Discord.js](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Railway Documentation](https://docs.railway.app)

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
