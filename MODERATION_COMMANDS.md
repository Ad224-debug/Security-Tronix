# 🛡️ Comandos de Moderación - VEXOR BOT

## Comandos Mejorados

### `/kick` - Expulsar Usuario
**Permisos:** Expulsar Miembros
**Mejoras:**
- ✅ Validaciones de seguridad completas
- ✅ No puedes expulsarte a ti mismo
- ✅ No puedes expulsar al dueño del servidor
- ✅ Verifica jerarquía de roles
- ✅ Envía DM al usuario antes de expulsar
- ✅ Embed mejorado con thumbnail del usuario
- ✅ Muestra ID del usuario
- ✅ Footer informativo

**Uso:**
```
/kick user:@Usuario reason:Spam
```

---

### `/ban` - Banear Usuario
**Permisos:** Banear Miembros
**Mejoras:**
- ✅ Validaciones de seguridad completas
- ✅ Puede banear usuarios que ya no están en el servidor
- ✅ Opción de eliminar mensajes (0-7 días)
- ✅ Envía DM al usuario antes de banear
- ✅ Embed mejorado con información detallada
- ✅ Footer indica que es baneo permanente

**Uso:**
```
/ban user:@Usuario reason:Raid days:7
```

---

## Comandos Nuevos

### `/softban` - Softban (Limpiar Mensajes)
**Permisos:** Banear Miembros
**Descripción:** Banea y desbanea inmediatamente al usuario para eliminar sus mensajes sin banearlo permanentemente.

**Características:**
- 🧹 Elimina mensajes del usuario (1-7 días)
- 🚪 El usuario puede volver a unirse
- ✅ Útil para limpiar spam sin baneo permanente
- ✅ Validaciones de seguridad

**Uso:**
```
/softban user:@Spammer reason:Spam days:7
```

---

### `/history` - Historial de Moderación
**Permisos:** Moderar Miembros
**Descripción:** Muestra el historial completo de advertencias de un usuario.

**Características:**
- 📋 Muestra todas las advertencias del usuario
- 👮 Indica qué moderador dio cada advertencia
- 🕐 Muestra fecha de cada advertencia
- 📊 Contador total de advertencias
- 🔍 Muestra las 10 más recientes

**Uso:**
```
/history user:@Usuario
```

---

### `/lockdown` - Bloqueo Masivo de Servidor
**Permisos:** Administrador
**Descripción:** Bloquea o desbloquea TODOS los canales de texto del servidor a la vez.

**Características:**
- 🔒 Bloquea todos los canales de texto
- 🔓 Desbloquea todos los canales de texto
- 📊 Muestra cuántos canales fueron afectados
- ⚡ Útil para emergencias (raids, ataques)
- 📝 Registra razón del lockdown

**Uso:**
```
/lockdown action:lock reason:Raid en progreso
/lockdown action:unlock reason:Raid terminado
```

---

### `/nuke` - Nukear Canal
**Permisos:** Gestionar Canales
**Descripción:** Clona el canal actual y elimina el original, borrando todos los mensajes.

**Características:**
- 💣 Elimina TODOS los mensajes del canal
- 🔄 Mantiene configuración del canal (permisos, topic, etc.)
- 📍 Mantiene la posición del canal
- ⏱️ Cuenta regresiva de 3 segundos
- 🎬 GIF de explosión al finalizar

**Uso:**
```
/nuke
```

**⚠️ ADVERTENCIA:** Esta acción es IRREVERSIBLE. Todos los mensajes se perderán permanentemente.

---

## Comandos Existentes (Ya Funcionales)

### `/timeout` - Aislar Usuario Temporalmente
**Permisos:** Moderar Miembros
**Descripción:** Aísla a un usuario por un tiempo determinado (1-10080 minutos = 7 días).

**Uso:**
```
/timeout user:@Usuario duration:60 reason:Flood
```

---

### `/untimeout` - Quitar Aislamiento
**Permisos:** Moderar Miembros
**Descripción:** Quita el timeout de un usuario.

**Uso:**
```
/untimeout user:@Usuario
```

---

### `/warn` - Advertir Usuario
**Permisos:** Moderar Miembros
**Descripción:** Advierte a un usuario y registra la advertencia.

**Características:**
- ⚠️ Sistema de advertencias acumulativas
- 📨 Envía DM al usuario (configurable)
- ⚡ Acciones automáticas al alcanzar umbral
- 📊 Contador de advertencias

**Uso:**
```
/warn user:@Usuario reason:Lenguaje inapropiado
```

---

### `/unwarn` - Quitar Advertencia
**Permisos:** Moderar Miembros
**Descripción:** Quita una advertencia específica de un usuario.

**Uso:**
```
/unwarn user:@Usuario index:1 reason:Apelación aceptada
```

---

### `/warnings` - Ver Advertencias
**Permisos:** Moderar Miembros
**Descripción:** Muestra todas las advertencias de un usuario.

**Uso:**
```
/warnings user:@Usuario
```

---

### `/warnsetup` - Configurar Sistema de Advertencias
**Permisos:** Administrador
**Descripción:** Configura el comportamiento del sistema de advertencias.

**Opciones:**
- `dm_notifications`: Enviar DM al usuario advertido
- `auto_action`: Acción automática (none/kick/ban/mute)
- `auto_action_threshold`: Número de advertencias para acción automática

**Uso:**
```
/warnsetup dm_notifications:true auto_action:kick threshold:3
```

---

### `/unban` - Desbanear Usuario
**Permisos:** Banear Miembros
**Descripción:** Quita el baneo de un usuario.

**Uso:**
```
/unban user_id:123456789 reason:Apelación aceptada
```

---

### `/lock` - Bloquear Canal
**Permisos:** Gestionar Canales
**Descripción:** Bloquea el canal actual para que solo moderadores puedan escribir.

**Uso:**
```
/lock
```

---

### `/unlock` - Desbloquear Canal
**Permisos:** Gestionar Canales
**Descripción:** Desbloquea el canal actual.

**Uso:**
```
/unlock
```

---

### `/slowmode` - Modo Lento
**Permisos:** Gestionar Canales
**Descripción:** Establece un tiempo de espera entre mensajes (0-21600 segundos).

**Uso:**
```
/slowmode seconds:10
```

---

### `/purge` - Eliminar Mensajes
**Permisos:** Gestionar Mensajes
**Descripción:** Elimina una cantidad específica de mensajes (1-100).

**Uso:**
```
/purge amount:50
```

---

## Resumen de Mejoras

### Comandos Mejorados:
- ✅ `/kick` - Mejor diseño, más validaciones, DM al usuario
- ✅ `/ban` - Mejor diseño, más validaciones, DM al usuario

### Comandos Nuevos:
- ✨ `/softban` - Limpiar mensajes sin baneo permanente
- ✨ `/history` - Ver historial completo de moderación
- ✨ `/lockdown` - Bloqueo masivo de servidor
- ✨ `/nuke` - Limpiar canal completamente

### Características Generales:
- 🎨 Embeds mejorados con mejor diseño
- 🔒 Validaciones de seguridad robustas
- 🌐 Soporte completo para español e inglés
- 📱 Mensajes DM a usuarios afectados
- 🆔 Muestra IDs de usuarios
- 👤 Thumbnails de avatares
- ⏰ Timestamps relativos
- 📊 Información detallada en cada acción

---

## Próximos Comandos Sugeridos

### Moderación Avanzada:
- `/modnick` - Cambiar nickname de un usuario
- `/modstats` - Estadísticas de moderación del servidor
- `/case` - Ver detalles de un caso de moderación específico
- `/note` - Agregar nota a un usuario (sin advertencia)

### Utilidades de Moderación:
- `/raid` - Modo anti-raid automático
- `/verify` - Sistema de verificación
- `/automod` - Configurar auto-moderación
- `/filter` - Filtro de palabras prohibidas
