# 💡 Sistema de Sugerencias

Sistema completo para que los usuarios puedan enviar sugerencias y el staff pueda gestionarlas.

## Características

- Envío de sugerencias por usuarios
- Votación con reacciones (✅ ❌)
- Aprobación/Rechazo por staff
- Notificaciones automáticas al autor
- Sistema de IDs únicos
- Historial de sugerencias
- Estados: Pendiente, Aprobada, Rechazada

## Comandos

### Para Usuarios

#### `/suggest`
Envía una sugerencia al servidor.

**Opciones:**
- `suggestion` - Tu sugerencia (máximo 1000 caracteres)

**Ejemplo:**
```
/suggest suggestion:Agregar un canal de memes
```

**Resultado:**
- La sugerencia se envía al canal configurado
- Se agregan reacciones automáticas para votar
- Recibes confirmación por DM

### Para Administradores

#### `/suggestion setup`
Configura el canal donde se enviarán las sugerencias.

**Permisos:** Administrador

**Opciones:**
- `channel` - Canal para sugerencias

**Ejemplo:**
```
/suggestion setup channel:#sugerencias
```

#### `/suggestion approve`
Aprueba una sugerencia.

**Permisos:** Administrador

**Opciones:**
- `id` - ID de la sugerencia
- `reason` - Razón de aprobación (opcional)

**Ejemplo:**
```
/suggestion approve id:1 reason:Excelente idea, lo implementaremos pronto
```

**Resultado:**
- El embed se actualiza a color verde
- El estado cambia a "✅ Aprobada"
- El autor recibe notificación por DM

#### `/suggestion deny`
Rechaza una sugerencia.

**Permisos:** Administrador

**Opciones:**
- `id` - ID de la sugerencia
- `reason` - Razón de rechazo (opcional)

**Ejemplo:**
```
/suggestion deny id:2 reason:No es viable en este momento
```

**Resultado:**
- El embed se actualiza a color rojo
- El estado cambia a "❌ Rechazada"
- El autor recibe notificación por DM

#### `/suggestion list`
Lista todas las sugerencias pendientes.

**Permisos:** Administrador

**Ejemplo:**
```
/suggestion list
```

**Muestra:**
- ID de cada sugerencia
- Autor
- Fecha
- Primeras 100 caracteres de la sugerencia

#### `/suggestion view`
Ver detalles completos de una sugerencia.

**Permisos:** Administrador

**Opciones:**
- `id` - ID de la sugerencia

**Ejemplo:**
```
/suggestion view id:5
```

**Muestra:**
- Sugerencia completa
- Autor y fecha
- Estado actual
- Revisor y razón (si fue revisada)

## Flujo de Trabajo

### 1. Usuario Envía Sugerencia
```
Usuario: /suggest suggestion:Mi idea genial
Bot: ✅ Tu sugerencia #1 ha sido enviada
```

### 2. Sugerencia Aparece en Canal
- Embed con la sugerencia
- Reacciones ✅ ❌ para votar
- Estado: ⏳ Pendiente

### 3. Staff Revisa
```
Admin: /suggestion list
Bot: [Muestra lista de pendientes]

Admin: /suggestion view id:1
Bot: [Muestra detalles completos]
```

### 4. Staff Decide
```
Admin: /suggestion approve id:1 reason:Buena idea
Bot: ✅ Sugerencia aprobada
```

### 5. Usuario es Notificado
```
Bot (DM): ✅ Tu sugerencia #1 en ServerName fue aprobada
Razón: Buena idea
```

## Estructura de Datos

Las sugerencias se guardan en `data/suggestions.json`:

```json
{
  "GUILD_ID": [
    {
      "id": 1,
      "userId": "USER_ID",
      "username": "User#1234",
      "suggestion": "Texto de la sugerencia",
      "messageId": "MESSAGE_ID",
      "channelId": "CHANNEL_ID",
      "status": "pending",
      "timestamp": 1234567890,
      "votes": { "yes": 0, "no": 0 },
      "reviewedBy": "ADMIN_ID",
      "reviewReason": "Razón",
      "reviewedAt": 1234567890
    }
  ]
}
```

## Estados de Sugerencias

| Estado | Emoji | Color | Descripción |
|--------|-------|-------|-------------|
| Pendiente | ⏳ | Azul | Esperando revisión |
| Aprobada | ✅ | Verde | Aceptada por staff |
| Rechazada | ❌ | Rojo | Rechazada por staff |

## Permisos Necesarios

### Bot:
- Ver canales
- Enviar mensajes
- Insertar enlaces
- Agregar reacciones
- Gestionar mensajes (para editar embeds)

### Usuarios:
- Ninguno especial (todos pueden sugerir)

### Administradores:
- Permiso de Administrador en Discord

## Casos de Uso

### Servidor de Gaming
- Sugerencias de nuevos juegos
- Ideas para eventos
- Mejoras al servidor

### Servidor de Comunidad
- Nuevos canales
- Roles personalizados
- Actividades comunitarias

### Servidor de Desarrollo
- Features para el proyecto
- Mejoras de código
- Herramientas útiles

## Buenas Prácticas

### Para Usuarios:
1. Sé específico en tu sugerencia
2. Explica por qué sería útil
3. Una sugerencia a la vez
4. Sé respetuoso

### Para Staff:
1. Revisa sugerencias regularmente
2. Da razones claras al aprobar/rechazar
3. Agradece las contribuciones
4. Considera implementar las aprobadas

## Personalización

### Cambiar Emojis de Votación
Edita `commands/suggest.js` líneas:
```javascript
await message.react('✅');
await message.react('❌');
```

### Cambiar Colores
- Pendiente: `0x5865F2` (Azul)
- Aprobada: `0x57F287` (Verde)
- Rechazada: `0xED4245` (Rojo)

### Límite de Caracteres
Actual: 1000 caracteres
Modificar en `commands/suggest.js`:
```javascript
.setMaxLength(1000)
```

## Solución de Problemas

### "El sistema no está configurado"
- Usa `/suggestion setup` primero

### "El canal no existe"
- El canal fue eliminado
- Configura uno nuevo con `/suggestion setup`

### "No se encontró la sugerencia"
- Verifica el ID con `/suggestion list`
- El ID debe ser un número

### Las reacciones no aparecen
- Verifica permisos del bot
- El bot necesita "Agregar Reacciones"

## Estadísticas

Para ver estadísticas de sugerencias, puedes crear un comando adicional que muestre:
- Total de sugerencias
- Aprobadas vs Rechazadas
- Usuario más activo
- Tasa de aprobación

## Integración con Otros Sistemas

### Con Sistema de Niveles:
- Dar XP por sugerencias aprobadas

### Con Sistema de Economía:
- Recompensas por sugerencias implementadas

### Con Sistema de Roles:
- Rol especial para usuarios con X sugerencias aprobadas

---

¿Necesitas ayuda? Usa `/help` para ver todos los comandos disponibles.
