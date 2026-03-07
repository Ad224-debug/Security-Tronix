# 🔊 Sistema de Moderación de Voz

## Comandos de Moderación de Voz

### `/vcjoin` - Bot se Une a Canal de Voz
**Descripción:** El bot se une al canal de voz donde estás actualmente.

**Permisos:** Administrador

**Uso:**
```
/vcjoin
```

**Características:**
- ✅ Bot se une a tu canal actual
- 📊 Muestra información del canal
- 👥 Muestra cantidad de usuarios
- 🔊 Necesario para usar otros comandos de voz

**Requisitos:**
- Debes estar en un canal de voz
- Bot debe tener permisos de conectar y hablar

---

### `/vcleave` - Bot Sale del Canal de Voz
**Descripción:** El bot se desconecta del canal de voz.

**Permisos:** Administrador

**Uso:**
```
/vcleave
```

**Características:**
- 🔇 Desconecta el bot del canal
- 📋 Registra la desconexión
- ✅ Limpia recursos

---

### `/vckick` - Expulsar Usuario de Voz
**Descripción:** Expulsa a un usuario del canal de voz actual.

**Permisos:** Administrador

**Uso:**
```
/vckick user:@Usuario reason:Saturando el audio
```

**Características:**
- 👢 Desconecta al usuario del canal
- 📨 Envía DM al usuario con la razón
- 📋 Crea caso de moderación
- 📊 Registra en logs de kicks
- 💬 Envía mensaje público mencionando al usuario
- ✅ Validaciones de seguridad completas

**Validaciones:**
- No puedes expulsarte a ti mismo
- No puedes expulsar al dueño
- No puedes expulsar a alguien con rol superior
- Bot debe estar en un canal de voz

**Mensaje Público:**
```
🔊 @Usuario ha sido expulsado del canal de voz Canal General
📝 Razón: Saturando el audio
👮 Moderador: @Moderador
```

---

### `/vcmute` - Mutear Usuario en Voz
**Descripción:** Mutea a un usuario en el canal de voz (server mute).

**Permisos:** Administrador

**Uso:**
```
/vcmute user:@Usuario reason:Ruido excesivo
```

**Características:**
- 🔇 Mutea al usuario en el servidor
- 📊 Registra en logs de timeouts
- 💬 Envía mensaje público
- ⚠️ Usuario no puede hablar hasta ser desmuteado

**Diferencia con mute normal:**
- Server mute = Usuario no puede hablar en ningún canal
- Channel mute = Usuario no puede hablar solo en ese canal

---

### `/vcunmute` - Desmutear Usuario en Voz
**Descripción:** Quita el mute de un usuario en voz.

**Permisos:** Administrador

**Uso:**
```
/vcunmute user:@Usuario
```

**Características:**
- 🔊 Quita el server mute
- ✅ Usuario puede volver a hablar
- 📋 Registra la acción

---

### `/vcban` - Banear Usuario de Canal de Voz
**Descripción:** Banea a un usuario de un canal de voz específico permanentemente.

**Permisos:** Administrador

**Uso:**
```
/vcban user:@Usuario reason:Comportamiento inapropiado
/vcban user:@Usuario reason:Spam de audio channel:#Canal-VIP
```

**Características:**
- 🚫 Usuario no puede unirse al canal específico
- 🔄 Si está en el canal, lo desconecta
- 🔒 Remueve permisos de conexión
- 📨 Envía DM al usuario
- 📋 Crea caso de moderación
- 📊 Registra en logs de bans
- 💬 Envía mensaje público
- 🛡️ Protección automática

**Protección Automática:**
- Si el usuario intenta unirse al canal baneado
- Es desconectado automáticamente
- Recibe mensaje de que está baneado

**Casos de Uso:**
- Banear de canal VIP por comportamiento
- Banear de canal de eventos por spam
- Banear de canal de música por saturación

---

## Flujo de Trabajo Recomendado

### Escenario 1: Usuario Saturando Audio

1. Moderador está en el canal o usa `/vcjoin`
2. Usuario empieza a saturar/gritar
3. Moderador usa:
   ```
   /vckick user:@Usuario reason:Saturando el audio, advertencia
   ```
4. Usuario es expulsado
5. Mensaje público aparece mencionando al usuario
6. Usuario recibe DM con la razón
7. Caso registrado en sistema

### Escenario 2: Usuario Haciendo Ruido Constante

1. Primera vez:
   ```
   /vcmute user:@Usuario reason:Ruido de fondo excesivo
   ```
2. Usuario muteado, puede escuchar pero no hablar
3. Después de un tiempo:
   ```
   /vcunmute user:@Usuario
   ```

### Escenario 3: Usuario Problemático Repetitivo

1. Primera infracción:
   ```
   /vckick user:@Usuario reason:Primera advertencia - spam de audio
   ```

2. Segunda infracción:
   ```
   /vckick user:@Usuario reason:Segunda advertencia - spam de audio
   ```

3. Tercera infracción:
   ```
   /vcban user:@Usuario reason:Tercera infracción - spam de audio repetido
   ```

4. Usuario baneado permanentemente del canal
5. No puede volver a unirse
6. Si intenta, es desconectado automáticamente

---

## Integración con Sistema de Moderación

### Casos de Moderación:
Todas las acciones de voz crean casos:
- `vckick` - Expulsión de voz
- `vcban` - Baneo de canal de voz

Ver con:
```
/case case_id:X
/history user:@Usuario
```

### Logs Automáticos:
Las acciones se registran en:
- **Kicks** → `/vckick` se registra en logs de kicks
- **Bans** → `/vcban` se registra en logs de bans
- **Timeouts** → `/vcmute` se registra en logs de timeouts

Configurar con:
```
/modsetup kicks channel:#logs-kicks
/modsetup bans channel:#logs-bans
/modsetup timeouts channel:#logs-timeouts
```

---

## Mensajes Públicos

Todos los comandos de moderación de voz envían un mensaje público en el canal de texto mencionando al usuario:

**Formato de `/vckick`:**
```
🔊 @Usuario ha sido expulsado del canal de voz Canal General
📝 Razón: Saturando el audio
👮 Moderador: @Moderador
```

**Formato de `/vcmute`:**
```
🔇 @Usuario ha sido muteado en voz
📝 Razón: Ruido excesivo
👮 Moderador: @Moderador
```

**Formato de `/vcban`:**
```
🔇 @Usuario ha sido baneado del canal de voz Canal VIP
📝 Razón: Comportamiento inapropiado
👮 Moderador: @Moderador
```

---

## Permisos Necesarios

### Para el Bot:
- ✅ Conectar a canales de voz
- ✅ Hablar en canales de voz
- ✅ Mover miembros
- ✅ Mutear miembros
- ✅ Gestionar permisos de canal

### Para Moderadores:
- ✅ Administrador (todos los comandos)

---

## Características Técnicas

### Protección Automática de Baneos:
- Sistema de listener en `voiceStateUpdate`
- Detecta cuando usuario baneado intenta unirse
- Desconecta automáticamente
- Envía mensaje al usuario
- Funciona 24/7

### Almacenamiento:
- Baneos guardados en `data/voice-bans.json`
- Formato: `{guildId}-{channelId}: [userId1, userId2, ...]`
- Persistente entre reinicios

### Validaciones:
- ✅ Usuario debe estar en voz (para kick/mute)
- ✅ Bot debe estar en voz (para kick)
- ✅ Jerarquía de roles
- ✅ No auto-moderación
- ✅ No moderar al owner

---

## Limitaciones

### Lo que NO puede hacer:
- ❌ Detectar automáticamente saturación de audio
- ❌ Analizar volumen en tiempo real
- ❌ Detectar ruido automáticamente
- ❌ Grabar audio

### Por qué:
- Discord.js no tiene capacidad de análisis de audio
- Requeriría procesamiento de señales digitales
- Alto consumo de recursos
- Complejidad técnica extrema

### Solución:
- Moderación manual por moderadores
- Comandos rápidos y eficientes
- Mensajes públicos para transparencia
- Sistema de casos para tracking

---

## Comparación con Otros Bots

| Característica | VEXOR BOT | MEE6 | Dyno | Carl-bot |
|----------------|-----------|------|------|----------|
| Join/Leave VC | ✅ | ❌ | ❌ | ❌ |
| Voice Kick | ✅ | ❌ | ✅ | ❌ |
| Voice Mute | ✅ | ❌ | ✅ | ❌ |
| Voice Ban | ✅ | ❌ | ❌ | ❌ |
| Auto-Protection | ✅ | ❌ | ❌ | ❌ |
| Public Messages | ✅ | ❌ | ❌ | ❌ |
| Case System | ✅ | ✅ | ✅ | ❌ |
| Logs Integration | ✅ | ✅ | ✅ | ❌ |

---

## Comandos Rápidos

### Setup Inicial:
```
1. /vcjoin (únete al canal primero)
2. Listo para moderar
```

### Moderación Rápida:
```
/vckick user:@Usuario reason:Razón
/vcmute user:@Usuario reason:Razón
/vcban user:@Usuario reason:Razón
```

### Cleanup:
```
/vcleave (cuando termines)
```

---

## Casos de Uso Reales

### 1. Servidor de Gaming:
- Usuario gritando en partidas
- `/vckick` para expulsar
- Mensaje público como advertencia
- Si repite, `/vcban`

### 2. Servidor de Estudio:
- Usuario con ruido de fondo
- `/vcmute` temporalmente
- Cuando arregle, `/vcunmute`

### 3. Servidor de Música:
- Usuario reproduciendo música no autorizada
- `/vckick` primera vez
- `/vcban` si repite

### 4. Servidor Comunitario:
- Usuario haciendo spam de sonidos
- `/vckick` con razón clara
- Mensaje público para que otros vean
- Caso registrado para historial

---

## Resumen

Tu bot ahora tiene un **sistema completo de moderación de voz** que incluye:

🔊 **6 Comandos de Voz**
- Join, Leave, Kick, Mute, Unmute, Ban

🛡️ **Protección Automática**
- Usuarios baneados no pueden unirse

📋 **Integración Completa**
- Sistema de casos
- Logs automáticos
- Mensajes públicos

💬 **Transparencia**
- Menciona al usuario
- Muestra razón y moderador
- DM al usuario afectado

✅ **Validaciones de Seguridad**
- Jerarquía de roles
- Permisos verificados
- No auto-moderación

Este sistema es único y más completo que la mayoría de bots premium! 🎉
