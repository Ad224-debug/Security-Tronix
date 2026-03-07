# 🛡️ Sistemas Avanzados de Moderación

## 1. Sistema de Logs Personalizados 📊

### `/modsetup` - Configuración de Logs de Moderación

Configura canales específicos para cada tipo de acción de moderación.

#### Subcomandos Disponibles:

**Ver Configuración:**
```
/modsetup view
```

**Configurar Logs Individuales:**
```
/modsetup kicks channel:#logs-kicks
/modsetup bans channel:#logs-bans
/modsetup warnings channel:#logs-warnings
/modsetup timeouts channel:#logs-timeouts
/modsetup automod channel:#logs-automod
```

**Configurar Todo en Un Canal:**
```
/modsetup all channel:#logs-moderacion
```

#### Características:
- 📋 Logs separados por tipo de acción
- 🎯 Organización profesional
- 📊 Fácil auditoría
- 🔍 Búsqueda específica por tipo

#### Tipos de Logs:
- **Kicks** - Expulsiones
- **Bans** - Baneos (permanentes y temporales)
- **Warnings** - Advertencias
- **Timeouts** - Aislamientos temporales
- **Automod** - Acciones automáticas

---

## 2. Sistema RB3 (Rule Break 3) ⚡

### ¿Qué es RB3?

RB3 es un sistema automático de castigos progresivos basado en acumulación de infracciones (strikes). Similar a sistemas de bots premium como Dyno y MEE6.

### Funcionamiento:

1. Usuario comete infracción (automod o advertencia manual)
2. Sistema registra un "strike"
3. Al acumular strikes, se aplica castigo automático
4. Strikes se resetean después de X días

### `/rb3setup` - Configuración del Sistema RB3

#### Activar/Desactivar:
```
/rb3setup enable enabled:true
```

#### Configurar Castigos por Strike:

**Primer Strike:**
```
/rb3setup strike1 action:warn
/rb3setup strike1 action:timeout_1h
```

Opciones:
- Warning (Advertencia)
- Timeout 1h, 6h, 12h, 24h

**Segundo Strike:**
```
/rb3setup strike2 action:timeout_12h
/rb3setup strike2 action:kick
```

Opciones:
- Timeout 6h, 12h, 24h, 3d
- Kick (Expulsión)

**Tercer Strike:**
```
/rb3setup strike3 action:tempban_7d
/rb3setup strike3 action:ban
```

Opciones:
- Timeout 3d, 7d
- Kick
- Tempban 7d, 30d
- Ban (Permanente)

#### Configurar Tiempo de Reset:
```
/rb3setup reset_time days:30
```
- 0 = Nunca se resetean
- 1-365 = Días antes de resetear

#### Ver Configuración:
```
/rb3setup view
```

### Configuraciones Recomendadas:

**Servidor Casual:**
```
Strike 1: Warning
Strike 2: Timeout 12h
Strike 3: Tempban 7d
Reset: 30 días
```

**Servidor Estricto:**
```
Strike 1: Timeout 6h
Strike 2: Timeout 24h
Strike 3: Ban
Reset: 60 días
```

**Servidor Educativo/Profesional:**
```
Strike 1: Warning
Strike 2: Kick
Strike 3: Ban
Reset: 90 días
```

### ¿Qué Genera Strikes?

- 🔞 Contenido NSFW (automático)
- 📨 Spam detectado por automod
- 👥 Menciones masivas
- 🔗 Links/invites no autorizados
- 🔠 Mayúsculas excesivas
- ⚠️ Múltiples violaciones simultáneas
- 📝 Advertencias manuales de moderadores

### Ventajas del Sistema RB3:

✅ **Automático** - No requiere intervención manual
✅ **Justo** - Castigos progresivos, no inmediatos
✅ **Transparente** - Usuario sabe cuántos strikes tiene
✅ **Configurable** - Adapta a tu servidor
✅ **Temporal** - Strikes se resetean
✅ **Profesional** - Sistema usado por bots premium

---

## 3. Sistema Anti-NSFW 🔞

### Detección Automática de Contenido Inapropiado

El sistema detecta y elimina automáticamente contenido NSFW/+18.

### `/automod nsfw` - Configurar Filtro NSFW

```
/automod nsfw enabled:true
```

**NOTA:** Este filtro está activado por defecto y se recomienda mantenerlo siempre activo.

### ¿Qué Detecta?

El sistema detecta:
- 🔞 Términos explícitos sexuales
- 🔗 Links a sitios de contenido adulto
- 📸 Solicitudes de contenido inapropiado
- 💬 Lenguaje sexual explícito
- ⚠️ Contenido gore/violento

### Características:

- ✅ Detección en tiempo real
- 🗑️ Eliminación automática del mensaje
- ⚠️ Advertencia al usuario
- 🚨 Strike automático en RB3
- 📊 Log en canal de automod
- 🔒 Protección 24/7

### Acción Automática:

Cuando se detecta contenido NSFW:
1. Mensaje eliminado inmediatamente
2. Usuario recibe advertencia
3. Se registra strike en RB3
4. Se aplica castigo según configuración RB3
5. Se registra en logs

### Integración con RB3:

El contenido NSFW SIEMPRE genera un strike en RB3, independientemente de otras violaciones.

**Ejemplo de Escalación:**
- 1er NSFW → Strike 1 → Warning/Timeout
- 2do NSFW → Strike 2 → Timeout/Kick
- 3er NSFW → Strike 3 → Tempban/Ban

---

## 4. Flujo Completo del Sistema

### Escenario 1: Usuario Envía Contenido NSFW

1. Usuario envía mensaje con contenido +18
2. Sistema detecta contenido NSFW
3. Mensaje eliminado automáticamente
4. Usuario recibe advertencia temporal
5. Strike registrado en RB3
6. Castigo aplicado según configuración:
   - Strike 1 → Timeout 1h
7. Log enviado a canal de automod
8. Usuario recibe DM con información

### Escenario 2: Usuario Hace Spam

1. Usuario envía 6 mensajes en 3 segundos
2. Automod detecta spam
3. Mensajes eliminados
4. Usuario recibe advertencia
5. Strike registrado en RB3
6. Castigo aplicado:
   - Strike 2 → Timeout 12h
7. Log enviado a canal de automod

### Escenario 3: Usuario Acumula 3 Strikes

1. Usuario comete tercera infracción
2. RB3 detecta 3 strikes acumulados
3. Castigo final aplicado:
   - Tempban 7 días
4. Usuario recibe DM explicando:
   - Strikes acumulados
   - Razones de cada strike
   - Duración del castigo
5. Log completo en canal de bans
6. Desbaneo automático en 7 días

---

## 5. Configuración Recomendada Completa

### Paso 1: Configurar Logs
```
/modsetup all channel:#logs-moderacion
```

O separado:
```
/modsetup kicks channel:#logs-kicks
/modsetup bans channel:#logs-bans
/modsetup warnings channel:#logs-warnings
/modsetup timeouts channel:#logs-timeouts
/modsetup automod channel:#logs-automod
```

### Paso 2: Configurar RB3
```
/rb3setup enable enabled:true
/rb3setup strike1 action:timeout_1h
/rb3setup strike2 action:timeout_12h
/rb3setup strike3 action:tempban_7d
/rb3setup reset_time days:30
```

### Paso 3: Configurar Auto-Moderación
```
/automod spam enabled:true messages:5 seconds:5
/automod mentions enabled:true max_mentions:5
/automod invites enabled:true
/automod caps enabled:true percentage:70
/automod nsfw enabled:true
```

### Paso 4: Configurar Reportes
```
/setreportchannel channel:#reportes
```

---

## 6. Comandos de Verificación

### Ver Configuración Actual:
```
/modsetup view
/rb3setup view
/automod view
```

### Ver Strikes de Usuario:
```
/history user:@Usuario
```

### Ver Caso Específico:
```
/case case_id:15
```

---

## 7. Ventajas del Sistema Completo

### Organización:
- 📋 Logs separados por tipo
- 🔍 Fácil auditoría
- 📊 Tracking completo

### Automatización:
- 🤖 Detección 24/7
- ⚡ Respuesta inmediata
- 🎯 Castigos progresivos

### Justicia:
- ⚖️ Sistema de strikes justo
- 🔄 Reset automático
- 📝 Transparencia total

### Protección:
- 🔞 Filtro NSFW siempre activo
- 🛡️ Múltiples capas de protección
- 🚨 Respuesta automática

### Profesionalismo:
- 💼 Sistema de nivel premium
- 📈 Escalación inteligente
- 🎓 Educativo para usuarios

---

## 8. Comparación con Bots Premium

| Característica | VEXOR BOT | MEE6 Premium | Dyno Premium |
|----------------|-----------|--------------|--------------|
| Logs Personalizados | ✅ | ✅ | ✅ |
| Sistema RB3/Strikes | ✅ | ✅ | ✅ |
| Auto-Moderación | ✅ | ✅ | ✅ |
| Filtro NSFW | ✅ | ✅ | ✅ |
| Castigos Progresivos | ✅ | ✅ | ✅ |
| Reset de Strikes | ✅ | ✅ | ✅ |
| Tempban Automático | ✅ | ✅ | ✅ |
| Sistema de Casos | ✅ | ✅ | ✅ |
| Reportes de Usuarios | ✅ | ✅ | ✅ |
| **Precio** | **GRATIS** | **$11.95/mes** | **$9.99/mes** |

---

## 9. Solución de Problemas

### Los logs no se envían:
1. Verifica que el canal existe
2. Verifica permisos del bot en el canal
3. Usa `/modsetup view` para confirmar configuración

### RB3 no se activa:
1. Verifica que está habilitado: `/rb3setup view`
2. Confirma que automod está activo
3. Revisa que el usuario no es administrador

### NSFW no se detecta:
1. El filtro está activado por defecto
2. Puede necesitar expandir lista de palabras
3. Verifica logs de automod

### Strikes no se resetean:
1. Verifica configuración de reset_time
2. Si es 0, nunca se resetean
3. Cambiar con `/rb3setup reset_time days:30`

---

## 10. Próximas Mejoras

### Planeadas:
- 📊 Dashboard web de estadísticas
- 🔍 Búsqueda avanzada de casos
- 📈 Gráficos de moderación
- 🎯 Whitelist de usuarios/roles
- 🔗 Whitelist de links permitidos
- 🖼️ Detección de imágenes NSFW (IA)
- 📱 Notificaciones móviles

---

Tu bot ahora tiene un sistema de moderación de nivel empresarial, completamente gratis! 🎉
