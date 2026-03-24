# Ejemplos de Uso del Sistema de Eventos

## Ejemplo 1: Evento Simple

Crear un evento básico para mañana:

```
/event create 
  title:"Noche de Juegos" 
  start:"tomorrow 8pm" 
  description:"Jugaremos Among Us y Minecraft juntos"
```

Los usuarios verán un embed con botones para confirmar asistencia.

## Ejemplo 2: Evento con Capacidad Limitada

Crear un torneo con máximo 32 participantes:

```
/event create 
  title:"Torneo de Valorant" 
  start:"2024-12-20 18:00" 
  description:"Torneo 5v5, premios para los ganadores" 
  max_attendees:32
  location:"Servidor de Discord - Canal de Voz"
```

Cuando se llene, los usuarios adicionales irán a la lista de espera.

## Ejemplo 3: Evento con Rol Temporal

Crear un evento que asigna un rol especial a los asistentes:

```
/event create 
  title:"Sesión de Estudio" 
  start:"tomorrow 3pm" 
  description:"Estudiaremos para el examen de matemáticas" 
  role:@Estudiantes
  max_attendees:20
```

Los asistentes confirmados recibirán el rol @Estudiantes automáticamente.

## Ejemplo 4: Evento con Imagen

Crear un evento visualmente atractivo:

```
/event create 
  title:"Estreno de Película" 
  start:"friday 9pm" 
  description:"Veremos la nueva película de Marvel juntos" 
  image:"https://example.com/movie-poster.jpg"
  location:"Canal de Voz - Cine"
```

## Ejemplo 5: Editar un Evento

Cambiar la hora de inicio de un evento:

```
/event edit 
  event_id:"abc123-def456-ghi789" 
  start:"saturday 7pm"
```

Los recordatorios se reprogramarán automáticamente.

## Ejemplo 6: Ver Estadísticas

Ver tus propias estadísticas:

```
/event stats
```

Ver estadísticas de otro usuario:

```
/event stats user:@Usuario
```

## Ejemplo 7: Listar Eventos

Ver todos los eventos próximos:

```
/event list
```

Ver solo tus eventos:

```
/event list filter:My Events
```

Ver eventos en curso:

```
/event list filter:Ongoing
```

## Ejemplo 8: Ver Leaderboard

Ver los usuarios más activos en eventos:

```
/event leaderboard
```

Muestra el top 10 con eventos asistidos, creados y tasa de asistencia.

## Flujo Típico de Usuario

### Como Organizador:

1. **Crear el evento:**
   ```
   /event create title:"Raid de WoW" start:"saturday 8pm" max_attendees:25
   ```

2. **El bot responde:**
   - ✅ Evento creado con ID único
   - Embed publicado en el canal con botones RSVP
   - Recordatorios programados automáticamente

3. **Editar si es necesario:**
   ```
   /event edit event_id:"abc123" start:"saturday 9pm"
   ```

4. **Ver quién confirmó:**
   ```
   /event info event_id:"abc123"
   ```

5. **Después del evento:**
   - El bot automáticamente marca el evento como completado
   - Remueve los roles temporales
   - Registra las estadísticas

### Como Participante:

1. **Ver el evento en el canal**
   - Leer la descripción y detalles
   - Ver cuántos asistentes hay

2. **Confirmar asistencia:**
   - Clic en botón "✅ Confirmar"
   - Recibir confirmación efímera
   - Obtener rol temporal (si aplica)

3. **Recibir recordatorios:**
   - 24 horas antes: "⏰ El evento comienza en 24 horas"
   - 1 hora antes: "⏰ El evento comienza en 1 hora"
   - Al inicio: "🎉 El evento está comenzando ahora"

4. **Si el evento está lleno:**
   - Clic en "✅ Confirmar"
   - Mensaje: "⏳ Evento lleno. Posición en lista de espera: 3"
   - Si alguien cancela, recibir notificación de promoción

5. **Cancelar si es necesario:**
   - Clic en botón "❌ Cancelar"
   - Perder el rol temporal
   - Si había lista de espera, el siguiente usuario es promovido

## Casos de Uso Avanzados

### Evento Recurrente (Próximamente)

Para eventos que se repiten semanalmente:

```
/event create 
  title:"Reunión Semanal" 
  start:"next monday 7pm" 
  recurrence:"weekly"
  interval:1
```

### Evento de Día Completo

Para eventos sin hora específica de fin:

```
/event create 
  title:"Maratón de Streaming" 
  start:"saturday 10am" 
  end:"saturday 11pm"
  description:"Estaremos en vivo todo el día"
```

### Evento Privado con Rol Requerido

Combinar con el sistema de roles del servidor:

```
/event create 
  title:"Reunión de Staff" 
  start:"tomorrow 6pm" 
  role:@Staff
  max_attendees:10
```

Solo usuarios con permisos podrán ver y confirmar.

## Troubleshooting

### "El evento está lleno"
- Espera en la lista de espera
- Si alguien cancela, serás promovido automáticamente
- Recibirás un DM cuando seas promovido

### "Debes esperar X segundos"
- Hay un cooldown de 3 segundos entre cambios de RSVP
- Esto previene spam y errores accidentales

### "Solo el creador puede editar"
- Solo el creador del evento o administradores pueden modificarlo
- Contacta al creador o a un admin si necesitas cambios

### "Formato de fecha inválido"
- Usa formatos como: "2024-12-25 18:00"
- O formatos naturales: "tomorrow 3pm", "friday 8pm"
- Asegúrate de que la fecha sea al menos 5 minutos en el futuro

### No recibí recordatorios
- Verifica que tengas los DMs abiertos
- El bot intentará mencionarte en el canal si no puede enviarte DM
- Los recordatorios se envían 24h, 1h y al inicio del evento
