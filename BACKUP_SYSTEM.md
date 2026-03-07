# 💾 Sistema de Backup Automático

Sistema completo de respaldo automático para proteger los datos del bot.

## Características

- Backups automáticos diarios a las 3 AM
- Backup manual con comando
- Restauración de backups
- Limpieza automática de backups antiguos
- Metadata detallada de cada backup
- Compresión y organización eficiente

## Comandos

### `/backup create`
Crea un backup manual inmediatamente.

**Permisos:** Solo el dueño del servidor

**Ejemplo:**
```
/backup create
```

**Resultado:**
- Crea backup con timestamp único
- Muestra nombre del backup
- Indica cantidad de archivos respaldados

### `/backup list`
Lista todos los backups disponibles.

**Permisos:** Solo el dueño del servidor

**Ejemplo:**
```
/backup list
```

**Muestra:**
- Nombre del backup
- Fecha y hora
- Cantidad de archivos
- Tamaño total

### `/backup restore`
Restaura un backup específico.

**Permisos:** Solo el dueño del servidor

**Opciones:**
- `name` - Nombre del backup (con autocompletado)

**Ejemplo:**
```
/backup restore name:backup-2024-01-15-1234567890
```

**⚠️ IMPORTANTE:** Después de restaurar, debes reiniciar el bot para aplicar los cambios.

### `/backup delete`
Elimina un backup específico.

**Permisos:** Solo el dueño del servidor

**Opciones:**
- `name` - Nombre del backup (con autocompletado)

**Ejemplo:**
```
/backup delete name:backup-2024-01-15-1234567890
```

### `/backup cleanup`
Limpia backups antiguos.

**Permisos:** Solo el dueño del servidor

**Opciones:**
- `days` - Días a mantener (por defecto: 30)

**Ejemplo:**
```
/backup cleanup days:60
```

**Resultado:**
- Elimina backups con más de X días
- Muestra cantidad de backups eliminados

## Archivos Respaldados

### Archivos Principales:
- `config.json` - Configuración general
- `warnings.json` - Advertencias de usuarios
- `warn-config.json` - Configuración de advertencias
- `languages.json` - Traducciones

### Carpeta data/:
- `suggestions.json` - Sugerencias
- `events.json` - Eventos
- `event-config.json` - Configuración de eventos
- `event-stats.json` - Estadísticas de eventos
- `reminders.json` - Recordatorios
- `voice-bans.json` - Bans de voz
- `cases.json` - Casos de moderación
- Y todos los demás archivos en data/

## Backup Automático

### Programación:
- **Frecuencia:** Diario
- **Hora:** 3:00 AM (hora del servidor)
- **Retención:** 30 días automáticamente

### Proceso Automático:
1. A las 3 AM, el bot crea un backup
2. Guarda todos los archivos importantes
3. Limpia backups con más de 30 días
4. Registra el resultado en logs

### Logs:
```
✅ Automatic backup created: backup-2024-01-15-1234567890
🗑️ Cleaned up 2 old backups
```

## Estructura de Backups

### Directorio:
```
backups/
├── backup-2024-01-15-1234567890/
│   ├── metadata.json
│   ├── config.json
│   ├── warnings.json
│   ├── warn-config.json
│   ├── languages.json
│   └── data/
│       ├── suggestions.json
│       ├── events.json
│       └── ...
├── backup-2024-01-16-1234567891/
│   └── ...
└── backup-2024-01-17-1234567892/
    └── ...
```

### Metadata (metadata.json):
```json
{
  "timestamp": 1234567890,
  "date": "2024-01-15T03:00:00.000Z",
  "files": [
    "config.json",
    "warnings.json",
    "data/suggestions.json",
    "..."
  ],
  "guildId": "all",
  "version": "2.0.0"
}
```

## Casos de Uso

### 1. Backup Antes de Actualización
```
Admin: /backup create
Bot: ✅ Backup creado: backup-2024-01-15-1234567890
Admin: [Actualiza el bot]
```

### 2. Recuperación de Error
```
Admin: ¡El bot borró datos por error!
Admin: /backup list
Bot: [Muestra backups disponibles]
Admin: /backup restore name:backup-2024-01-14-1234567889
Bot: ✅ Backup restaurado. Reinicia el bot.
Admin: [Reinicia el bot]
```

### 3. Migración a Nuevo Servidor
```
Admin: /backup create
Admin: [Descarga el backup]
Admin: [Sube el backup al nuevo servidor]
Admin: /backup restore name:backup-2024-01-15-1234567890
```

### 4. Limpieza de Espacio
```
Admin: /backup list
Bot: [Muestra 50 backups]
Admin: /backup cleanup days:7
Bot: 🧹 Se eliminaron 43 backups antiguos
```

## Restauración Paso a Paso

### 1. Listar Backups
```
/backup list
```

### 2. Seleccionar Backup
Elige el backup que quieres restaurar basándote en:
- Fecha y hora
- Antes de un problema conocido
- Backup más reciente estable

### 3. Restaurar
```
/backup restore name:backup-2024-01-15-1234567890
```

### 4. Reiniciar Bot
**IMPORTANTE:** El bot debe reiniciarse para cargar los archivos restaurados.

En Railway:
1. Ve a tu proyecto
2. Deployments → Restart

En local:
1. Detén el bot (Ctrl+C)
2. Inicia de nuevo (node index.js)

### 5. Verificar
Verifica que todo funcione correctamente:
- Configuraciones
- Datos de usuarios
- Sistemas activos

## Seguridad

### Permisos:
- Solo el dueño del servidor puede usar comandos de backup
- Los backups se guardan localmente en el servidor
- No se comparten automáticamente

### Recomendaciones:
1. Descarga backups importantes manualmente
2. Guarda copias en múltiples ubicaciones
3. Verifica backups periódicamente
4. No compartas backups (contienen datos sensibles)

## Backup Manual (Sin Comando)

### Crear Backup Manual:
1. Detén el bot
2. Copia estas carpetas/archivos:
   - `config.json`
   - `warnings.json`
   - `warn-config.json`
   - `languages.json`
   - `data/` (carpeta completa)
3. Guarda en un lugar seguro
4. Reinicia el bot

### Restaurar Backup Manual:
1. Detén el bot
2. Reemplaza los archivos con los del backup
3. Reinicia el bot

## Monitoreo

### Verificar Backups Automáticos:
Revisa los logs del bot cada mañana:
```
✅ Automatic backup created: backup-2024-01-15-1234567890
```

### Si No Hay Backup:
1. Verifica que el bot esté corriendo 24/7
2. Revisa los logs de errores
3. Crea backup manual: `/backup create`

## Solución de Problemas

### "Error al crear backup"
- Verifica permisos de escritura
- Verifica espacio en disco
- Revisa logs del bot

### "Backup not found"
- Verifica el nombre exactamente
- Usa `/backup list` para ver disponibles
- El backup puede haber sido eliminado

### "Error al restaurar backup"
- Verifica que el backup sea válido
- Asegúrate de tener permisos
- Intenta con otro backup

### Backup no se crea automáticamente
- Verifica que el bot esté corriendo 24/7
- Revisa la configuración de cron jobs
- Verifica logs a las 3 AM

## Mejores Prácticas

### Para Administradores:
1. Crea backup antes de cambios importantes
2. Descarga backups críticos manualmente
3. Prueba la restauración periódicamente
4. Mantén al menos 7 días de backups
5. Documenta qué contiene cada backup importante

### Para Desarrollo:
1. Backup antes de actualizar el bot
2. Backup antes de cambiar configuraciones
3. Backup antes de migrar servidores
4. Backup antes de pruebas importantes

## Automatización Adicional

### Backup en Eventos Importantes:
Puedes modificar el código para crear backups automáticos cuando:
- Se cambia configuración crítica
- Se alcanza X cantidad de usuarios
- Antes de mantenimiento programado

### Notificaciones:
Configura notificaciones cuando:
- Backup automático falla
- Espacio en disco bajo
- Backup restaurado exitosamente

## Integración con Servicios Externos

### Google Drive / Dropbox:
Puedes configurar sincronización automática de la carpeta `backups/` con servicios en la nube.

### GitHub:
Puedes hacer commit automático de backups (sin datos sensibles) a un repositorio privado.

### FTP/SFTP:
Puedes enviar backups a un servidor remoto automáticamente.

---

## Estadísticas

- **Espacio por backup:** ~1-5 MB (depende de datos)
- **Tiempo de creación:** 1-3 segundos
- **Tiempo de restauración:** 1-3 segundos
- **Retención recomendada:** 30 días

---

¿Necesitas ayuda? Contacta al soporte del bot.
