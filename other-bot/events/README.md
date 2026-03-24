# Sistema de Eventos y RSVP

Sistema completo de gestión de eventos para Discord con confirmación de asistencia, recordatorios automáticos, roles temporales y estadísticas.

## Características

### 🎯 Gestión de Eventos
- Crear eventos con título, descripción, fecha/hora, ubicación e imagen
- Editar eventos existentes
- Cancelar eventos
- Listar eventos próximos
- Ver información detallada de eventos

### ✅ Sistema RSVP
- Botones interactivos para confirmar asistencia (Confirmar, Tal vez, Cancelar)
- Límite de asistentes configurable
- Lista de espera automática cuando el evento está lleno
- Promoción automática desde la lista de espera
- Cooldown de 3 segundos entre cambios de RSVP

### 🔔 Recordatorios Automáticos
- Recordatorio 24 horas antes del evento
- Recordatorio 1 hora antes del evento
- Recordatorio al inicio del evento
- Envío por DM con fallback a mención en canal
- Procesamiento en lotes para respetar rate limits

### 🎭 Roles Temporales
- Asignación automática de roles a asistentes confirmados
- Remoción automática al cancelar asistencia
- Remoción automática al completar el evento
- Verificación de permisos y jerarquía de roles

### 📊 Estadísticas
- Eventos asistidos por usuario
- Eventos creados por usuario
- Tasa de asistencia
- Leaderboard de top asistentes
- Estadísticas por servidor

### 🔄 Estados de Eventos
- **Scheduled** (Programado): Evento futuro, aceptando RSVPs
- **Ongoing** (En curso): Evento en progreso
- **Completed** (Completado): Evento finalizado
- **Cancelled** (Cancelado): Evento cancelado

### 🌐 Multiidioma
- Soporte completo para Español e Inglés
- Traducciones automáticas según configuración del servidor

## Comandos

### `/event create`
Crea un nuevo evento.

**Opciones:**
- `title` (requerido): Título del evento (máx 100 caracteres)
- `start` (requerido): Fecha/hora de inicio (ej: "2024-12-25 18:00" o "tomorrow 3pm")
- `description`: Descripción del evento (máx 2000 caracteres)
- `end`: Fecha/hora de fin
- `location`: Ubicación del evento
- `max_attendees`: Número máximo de asistentes
- `role`: Rol a asignar a los asistentes
- `image`: URL de imagen para el evento

**Ejemplo:**
```
/event create title:"Torneo de Gaming" start:"tomorrow 8pm" description:"Torneo semanal de Valorant" max_attendees:50
```

### `/event edit`
Edita un evento existente.

**Opciones:**
- `event_id` (requerido): ID del evento
- `title`: Nuevo título
- `description`: Nueva descripción
- `start`: Nueva fecha de inicio
- `location`: Nueva ubicación

**Permisos:** Solo el creador del evento o administradores

### `/event delete`
Cancela un evento.

**Opciones:**
- `event_id` (requerido): ID del evento

**Permisos:** Solo el creador del evento o administradores

### `/event list`
Lista eventos próximos.

**Opciones:**
- `filter`: Filtrar eventos (All, Scheduled, Ongoing, My Events)

### `/event info`
Muestra información detallada de un evento.

**Opciones:**
- `event_id` (requerido): ID del evento

### `/event stats`
Muestra estadísticas de participación.

**Opciones:**
- `user`: Usuario a consultar (por defecto: tú mismo)

### `/event leaderboard`
Muestra el top 10 de asistentes a eventos.

## Arquitectura

### Componentes

#### EventManager
- Gestión del ciclo de vida de eventos
- Validación de datos
- Cache en memoria para eventos activos
- Persistencia en disco con backups automáticos
- Índice por guild para consultas rápidas

#### RSVPManager
- Procesamiento de confirmaciones de asistencia
- Gestión de lista de espera con orden FIFO
- Verificación de capacidad
- Cooldowns y límites de cambios

#### RoleManager
- Asignación y remoción de roles
- Verificación de permisos del bot
- Validación de jerarquía de roles
- Limpieza masiva de roles

#### ReminderScheduler
- Programación de recordatorios
- Envío en lotes con rate limiting
- Fallback a menciones en canal
- Limpieza de recordatorios antiguos

#### StatisticsTracker
- Registro de asistencia
- Cálculo de métricas
- Leaderboards
- Limpieza de datos antiguos

### Archivos de Datos

#### `data/events.json`
Almacena todos los eventos y plantillas de recurrencia.

#### `data/event-stats.json`
Almacena estadísticas de usuarios y guilds.

#### `data/reminders.json`
Almacena recordatorios pendientes y enviados.

#### `data/event-config.json`
Configuración del sistema (intervalos, límites, políticas de limpieza).

### Cron Jobs

#### Recordatorios (cada 5 minutos)
Verifica y envía recordatorios pendientes.

#### Actualización de Estados (cada 10 minutos)
Transiciona eventos de scheduled → ongoing → completed.

#### Limpieza (diaria a las 2 AM)
- Elimina recordatorios enviados > 7 días
- Elimina estadísticas > 90 días
- Elimina eventos completados > 30 días

## Límites y Restricciones

- **Eventos por servidor:** 50 activos simultáneos
- **Eventos por usuario por día:** 5
- **Asistentes por evento:** 500 máximo
- **Cambios de RSVP por evento:** 10 por usuario
- **Cooldown entre RSVPs:** 3 segundos
- **Título:** 100 caracteres máximo
- **Descripción:** 2000 caracteres máximo

## Propiedades de Corrección

El sistema implementa 10 propiedades formales de corrección:

1. **Event Capacity Limit**: Los asistentes confirmados nunca exceden el máximo
2. **Attendee Uniqueness**: Cada usuario aparece máximo una vez en la lista
3. **Valid State Transitions**: Los eventos solo transicionan por rutas válidas
4. **Reminder Uniqueness**: Cada recordatorio se envía exactamente una vez
5. **Role-Attendance Consistency**: Los usuarios tienen el rol si y solo si están confirmados
6. **Waitlist FIFO Order**: La lista de espera mantiene orden cronológico
7. **Date Validity**: Las fechas son consistentes y válidas
8. **Statistics Accuracy**: Las estadísticas reflejan los datos reales
9. **Unique Event Identifiers**: Todos los eventos tienen IDs únicos
10. **Capacity Calculation Correctness**: El cálculo de capacidad es preciso

## Manejo de Errores

- Validación exhaustiva de datos de entrada
- Backups automáticos antes de cada escritura
- Recuperación desde backup en caso de corrupción
- Logs detallados de errores
- Respuestas amigables al usuario
- Reintentos automáticos para operaciones críticas

## Seguridad

- Verificación de permisos en todas las operaciones
- Sanitización de entradas de usuario
- Rate limiting para prevenir abuso
- Validación de jerarquía de roles
- Roles sin permisos administrativos

## Rendimiento

- Cache en memoria para eventos activos (próximos 7 días)
- Índices secundarios para consultas por guild
- Envío de recordatorios en lotes de 10
- Sincronización periódica cache-disco (cada 5 minutos)
- Limpieza automática de datos antiguos
