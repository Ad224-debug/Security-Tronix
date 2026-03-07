# 🛡️ Sistema de Moderación Profesional - VEXOR BOT

## Nuevas Funcionalidades Implementadas

### 1. Sistema de Casos de Moderación 📋

Todas las acciones de moderación ahora se registran automáticamente en un sistema de casos.

#### `/case` - Ver Detalles de un Caso
**Descripción:** Muestra información detallada de cualquier caso de moderación.

**Características:**
- 📋 ID único para cada acción
- 👤 Usuario afectado
- 👮 Moderador responsable
- 📝 Razón de la acción
- 🕐 Fecha y hora exacta
- ⏰ Duración (para tempban/timeout)
- ⏳ Fecha de expiración

**Uso:**
```
/case case_id:15
```

**Tipos de casos registrados:**
- ⚠️ Advertencias (warn)
- 👢 Expulsiones (kick)
- 🔨 Baneos (ban)
- ⏰ Baneos temporales (tempban)
- 🧹 Softbans
- ⏱️ Timeouts
- 🔓 Desbaneos (unban)
- 📝 Notas de moderadores

---

### 2. Baneo Temporal ⏰

#### `/tempban` - Banear Temporalmente
**Descripción:** Banea a un usuario por un tiempo específico y lo desbanea automáticamente.

**Características:**
- ⏰ Duración de 1 a 365 días
- 🔄 Desbaneo automático al expirar
- 📨 DM al usuario con información
- 🗑️ Opción de eliminar mensajes (0-7 días)
- 📋 Registro automático de caso
- ⏳ Muestra cuándo expira el baneo

**Uso:**
```
/tempban user:@Usuario days:7 reason:Spam delete_days:1
```

**Ventajas sobre ban normal:**
- No necesitas recordar desbanear
- El usuario sabe cuándo puede volver
- Perfecto para castigos temporales

---

### 3. Notas de Moderadores 📝

#### `/note` - Agregar Nota Privada
**Descripción:** Agrega una nota privada sobre un usuario sin notificarle.

**Características:**
- 📝 Nota visible solo para moderadores
- 🔒 El usuario NO es notificado
- 📋 Se registra como caso
- 🔍 Visible en `/history` y `/case`
- 💡 Útil para tracking interno

**Uso:**
```
/note user:@Usuario note:Usuario sospechoso, vigilar actividad
```

**Casos de uso:**
- Marcar usuarios sospechosos
- Registrar comportamiento problemático
- Notas para otros moderadores
- Tracking sin advertir al usuario

---

### 4. Sistema de Reportes 🚨

#### `/report` - Reportar Usuario
**Descripción:** Permite a los usuarios reportar violaciones a los moderadores.

**Características:**
- 🚨 Envía reporte al canal configurado
- 📝 Incluye razón y evidencia opcional
- 🔘 Botones de acción rápida para moderadores
- 🆔 ID único de reporte
- 👮 Notifica a administradores
- 🔗 Soporte para links de evidencia

**Uso:**
```
/report user:@Spammer reason:Spam en #general evidence:https://discord.com/channels/...
```

**Botones de acción para moderadores:**
- ⚠️ Advertir
- ⏱️ Timeout
- 👢 Expulsar
- 🔨 Banear
- ✖️ Descartar

#### `/setreportchannel` - Configurar Canal de Reportes
**Uso:**
```
/setreportchannel channel:#reportes
```

---

### 5. Auto-Moderación Avanzada 🤖

#### `/automod` - Configurar Auto-Moderación
**Descripción:** Sistema automático que detecta y elimina contenido problemático.

**Módulos disponibles:**

##### 📨 Anti-Spam
Detecta usuarios enviando muchos mensajes rápidamente.
```
/automod spam enabled:true messages:5 seconds:5
```
- Configurable: mensajes y tiempo
- Elimina mensajes automáticamente
- Advierte al usuario

##### 👥 Anti-Menciones Masivas
Previene spam de menciones.
```
/automod mentions enabled:true max_mentions:5
```
- Límite configurable de menciones
- Incluye usuarios y roles

##### 🔗 Filtro de Links
Bloquea todos los links.
```
/automod links enabled:true
```
- Detecta http:// y https://
- Útil para canales específicos

##### 📧 Filtro de Invitaciones
Bloquea invitaciones de Discord.
```
/automod invites enabled:true
```
- Detecta discord.gg, discord.com/invite
- Previene raids y publicidad

##### 🔠 Anti-Mayúsculas Excesivas
Detecta mensajes con demasiadas mayúsculas.
```
/automod caps enabled:true percentage:70
```
- Porcentaje configurable
- Mínimo 10 letras para activar

#### Ver Configuración
```
/automod view
```

**Características del sistema:**
- ✅ Elimina mensajes automáticamente
- ⚠️ Advierte al usuario (auto-elimina en 5s)
- 📊 Registra en canal de logs
- 🛡️ Ignora administradores
- 🤖 Funciona 24/7

---

## Comparación con Bots Premium

### Funcionalidades Similares a MEE6 Premium:
- ✅ Sistema de casos de moderación
- ✅ Auto-moderación avanzada
- ✅ Baneo temporal
- ✅ Filtros personalizables
- ✅ Logs detallados

### Funcionalidades Similares a Dyno Premium:
- ✅ Sistema de reportes
- ✅ Notas de moderadores
- ✅ Anti-spam configurable
- ✅ Filtro de invitaciones
- ✅ Acciones rápidas

### Funcionalidades Similares a Carl-bot:
- ✅ Tracking de casos
- ✅ Historial completo
- ✅ Auto-moderación
- ✅ Configuración granular

---

## Flujo de Trabajo Profesional

### Escenario 1: Usuario Problemático
1. Moderador ve comportamiento sospechoso
2. `/note user:@Usuario note:Comportamiento sospechoso`
3. Usuario continúa
4. `/warn user:@Usuario reason:Spam`
5. Usuario persiste
6. `/tempban user:@Usuario days:3 reason:Spam repetido`
7. Después de 3 días, desbaneo automático
8. `/case case_id:X` para revisar historial

### Escenario 2: Reporte de Usuario
1. Usuario usa `/report user:@Spammer reason:Spam`
2. Reporte llega a canal de moderación
3. Moderador ve botones de acción
4. Click en "Timeout" → Usuario aislado
5. Todo queda registrado automáticamente

### Escenario 3: Raid/Ataque
1. `/automod invites enabled:true`
2. `/automod spam enabled:true messages:3 seconds:3`
3. `/lockdown action:lock reason:Raid en progreso`
4. Bot elimina automáticamente spam e invites
5. Moderadores banean manualmente a raiders
6. `/lockdown action:unlock reason:Raid terminado`

---

## Configuración Recomendada

### Para Servidor Pequeño (< 100 miembros):
```
/automod spam enabled:true messages:5 seconds:5
/automod invites enabled:true
/automod caps enabled:true percentage:80
/setreportchannel channel:#staff
```

### Para Servidor Mediano (100-1000 miembros):
```
/automod spam enabled:true messages:4 seconds:4
/automod mentions enabled:true max_mentions:5
/automod invites enabled:true
/automod links enabled:true
/automod caps enabled:true percentage:70
/setreportchannel channel:#reportes
```

### Para Servidor Grande (1000+ miembros):
```
/automod spam enabled:true messages:3 seconds:3
/automod mentions enabled:true max_mentions:3
/automod invites enabled:true
/automod links enabled:true
/automod caps enabled:true percentage:60
/setreportchannel channel:#reportes-staff
/lockdown (tener preparado para emergencias)
```

---

## Ventajas del Sistema

### Organización:
- 📋 Todos los casos numerados y rastreables
- 🔍 Historial completo por usuario
- 📊 Logs automáticos de todo

### Eficiencia:
- 🤖 Auto-moderación 24/7
- ⚡ Acciones rápidas desde reportes
- ⏰ Desbaneos automáticos

### Transparencia:
- 📝 Razones registradas
- 👮 Moderador responsable visible
- 🕐 Timestamps exactos

### Profesionalismo:
- 💼 Sistema similar a bots premium
- 🎯 Configuración granular
- 🛡️ Protección multicapa

---

## Próximas Mejoras Sugeridas

### Estadísticas:
- `/modstats` - Estadísticas de moderación
- Dashboard de actividad
- Gráficos de acciones por día

### Automatización:
- Auto-warn por X violaciones de automod
- Escalación automática (warn → timeout → kick → ban)
- Whitelist de links permitidos

### Utilidades:
- `/reason` - Cambiar razón de un caso
- `/duration` - Cambiar duración de tempban
- `/search` - Buscar casos por usuario/moderador/tipo

---

## Comandos Completos del Sistema

### Moderación Básica:
- `/kick` - Expulsar
- `/ban` - Banear permanente
- `/tempban` - Banear temporal ⭐ NUEVO
- `/softban` - Limpiar mensajes
- `/timeout` - Aislar temporal
- `/untimeout` - Quitar aislamiento
- `/unban` - Desbanear

### Sistema de Advertencias:
- `/warn` - Advertir usuario
- `/unwarn` - Quitar advertencia
- `/warnings` - Ver advertencias
- `/warnsetup` - Configurar sistema

### Tracking y Casos:
- `/case` - Ver caso específico ⭐ NUEVO
- `/history` - Ver historial completo
- `/note` - Agregar nota privada ⭐ NUEVO

### Reportes:
- `/report` - Reportar usuario ⭐ NUEVO
- `/setreportchannel` - Configurar canal ⭐ NUEVO

### Auto-Moderación:
- `/automod spam` - Anti-spam ⭐ NUEVO
- `/automod mentions` - Anti-menciones ⭐ NUEVO
- `/automod links` - Filtro links ⭐ NUEVO
- `/automod invites` - Filtro invites ⭐ NUEVO
- `/automod caps` - Anti-mayúsculas ⭐ NUEVO
- `/automod view` - Ver config ⭐ NUEVO

### Utilidades:
- `/lockdown` - Bloqueo masivo
- `/nuke` - Limpiar canal
- `/userinfo` - Info de usuario

---

Tu bot ahora tiene un sistema de moderación de nivel profesional, comparable a bots premium como MEE6, Dyno y Carl-bot! 🎉
