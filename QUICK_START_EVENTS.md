# 🎉 Guía Rápida - Sistema de Eventos

## ¡Tu bot ahora tiene un sistema completo de eventos!

### 🚀 Cómo Empezar

1. **Inicia el bot:**
   ```bash
   npm start
   ```

2. **Crea tu primer evento:**
   ```
   /event create 
     title:"Mi Primer Evento" 
     start:"tomorrow 8pm" 
     description:"Evento de prueba"
   ```

3. **Los usuarios pueden confirmar con los botones:**
   - ✅ Confirmar
   - ❓ Tal vez
   - ❌ Cancelar

¡Eso es todo! El sistema se encarga del resto automáticamente.

---

## 📋 Comandos Disponibles

### Crear Evento
```
/event create 
  title:"Nombre del Evento" 
  start:"2024-12-25 18:00"
  description:"Descripción opcional"
  max_attendees:50
```

### Editar Evento
```
/event edit 
  event_id:"abc123" 
  title:"Nuevo Nombre"
```

### Cancelar Evento
```
/event delete event_id:"abc123"
```

### Ver Eventos
```
/event list
/event list filter:My Events
```

### Ver Detalles
```
/event info event_id:"abc123"
```

### Estadísticas
```
/event stats
/event stats user:@Usuario
```

### Leaderboard
```
/event leaderboard
```

---

## ✨ Características Automáticas

### 🔔 Recordatorios
Los asistentes reciben recordatorios automáticos:
- 24 horas antes
- 1 hora antes
- Al inicio del evento

### 🎭 Roles Temporales
Si asignas un rol al crear el evento:
- Se asigna automáticamente a los confirmados
- Se remueve al cancelar o al terminar el evento

### ⏳ Lista de Espera
Si el evento se llena:
- Nuevos usuarios van a lista de espera
- Se promueven automáticamente cuando hay espacio
- Reciben notificación por DM

### 📊 Estadísticas
El sistema registra automáticamente:
- Eventos asistidos por usuario
- Eventos creados
- Tasa de asistencia
- Leaderboard del servidor

---

## 🎯 Ejemplos Rápidos

### Torneo con Límite
```
/event create 
  title:"Torneo de Valorant" 
  start:"saturday 6pm" 
  max_attendees:32
  description:"Torneo 5v5, premios para ganadores"
```

### Evento con Rol
```
/event create 
  title:"Reunión de Staff" 
  start:"tomorrow 3pm" 
  role:@Staff
```

### Evento con Imagen
```
/event create 
  title:"Estreno de Película" 
  start:"friday 9pm" 
  image:"https://example.com/poster.jpg"
```

---

## 📁 Archivos Importantes

- **Eventos:** `data/events.json`
- **Estadísticas:** `data/event-stats.json`
- **Recordatorios:** `data/reminders.json`
- **Configuración:** `data/event-config.json`

---

## ⚙️ Configuración

Edita `data/event-config.json` para cambiar:
- Intervalos de recordatorios
- Límites de eventos por servidor
- Políticas de limpieza
- Rate limits

---

## 🆘 Solución de Problemas

### "El bot no responde"
- Verifica que el bot esté en línea
- Revisa los permisos del bot en el servidor

### "No puedo crear eventos"
- Verifica que no hayas alcanzado el límite (5 por día)
- El servidor no debe tener más de 50 eventos activos

### "No recibo recordatorios"
- Abre tus DMs para el bot
- Si están cerrados, el bot te mencionará en el canal

### "Error al asignar rol"
- El bot necesita permiso "Gestionar Roles"
- El rol del bot debe estar por encima del rol del evento

---

## 📚 Documentación Completa

Para más información, consulta:
- `events/README.md` - Documentación técnica completa
- `events/EXAMPLES.md` - Más ejemplos de uso
- `.kiro/specs/event-rsvp-system/` - Especificaciones del sistema

---

## 🎊 ¡Disfruta tu nuevo sistema de eventos!

El sistema está completamente automatizado. Solo crea eventos y deja que el bot se encargue de:
- ✅ Gestionar confirmaciones
- ✅ Enviar recordatorios
- ✅ Asignar roles
- ✅ Manejar listas de espera
- ✅ Registrar estadísticas
- ✅ Actualizar estados

**¡Todo funciona automáticamente!** 🚀
