# 🚂 Guía de Deployment en Railway

Esta guía te ayudará a deployar tu bot de Discord en Railway.app paso a paso.

## Requisitos Previos

- Cuenta en [Railway.app](https://railway.app)
- Cuenta en [GitHub](https://github.com)
- Tu bot debe estar en un repositorio de GitHub

## Paso 1: Preparar el Repositorio

### 1.1 Crear repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Nombra el repositorio (ejemplo: `vexor-bot`)
3. Hazlo privado si quieres mantenerlo privado
4. NO inicialices con README (ya tienes archivos)

### 1.2 Subir tu código a GitHub

Abre la terminal en la carpeta de tu bot y ejecuta:

```bash
# Inicializar git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit - Vexor Bot"

# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Subir el código
git branch -M main
git push -u origin main
```

**IMPORTANTE:** Asegúrate de que `.env` NO se suba (debe estar en `.gitignore`)

## Paso 2: Configurar Railway

### 2.1 Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Login" o "Start a New Project"
3. Conecta con tu cuenta de GitHub
4. Autoriza Railway para acceder a tus repositorios

### 2.2 Crear nuevo proyecto

1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona tu repositorio `vexor-bot`
4. Railway detectará automáticamente que es un proyecto Node.js

### 2.3 Configurar Variables de Entorno

Esto es CRÍTICO. Debes agregar las mismas variables que tienes en tu `.env`:

1. En tu proyecto de Railway, haz clic en tu servicio
2. Ve a la pestaña "Variables"
3. Agrega las siguientes variables:

```
DISCORD_TOKEN=tu_token_aqui
APPLICATION_ID=tu_application_id_aqui
```

**Para obtener estos valores:**
- Ve a [Discord Developer Portal](https://discord.com/developers/applications)
- Selecciona tu aplicación
- `DISCORD_TOKEN`: Bot → Token → Copy
- `APPLICATION_ID`: General Information → Application ID → Copy

### 2.4 Configurar el Comando de Inicio

Railway debería detectar automáticamente `node index.js`, pero verifica:

1. Ve a "Settings" en tu servicio
2. Busca "Start Command"
3. Asegúrate que diga: `node index.js`

## Paso 3: Deploy

1. Railway comenzará a deployar automáticamente
2. Verás los logs en tiempo real
3. Espera a que aparezca: `✅ Bot conectado como VEXOR BOT#1234`

## Paso 4: Verificar que Funciona

1. Ve a tu servidor de Discord
2. Prueba un comando como `/ping` o `/botinfo`
3. Si funciona, ¡felicidades! 🎉

## Monitoreo y Logs

### Ver logs en tiempo real:
1. En Railway, haz clic en tu servicio
2. Ve a la pestaña "Deployments"
3. Haz clic en el deployment activo
4. Verás los logs en tiempo real

### Reiniciar el bot:
1. Ve a "Deployments"
2. Haz clic en los tres puntos del deployment activo
3. Selecciona "Restart"

## Actualizar el Bot

Cada vez que hagas cambios en tu código:

```bash
# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

Railway detectará los cambios automáticamente y re-deployará el bot.

## Créditos Gratuitos

Railway te da **$5 USD de crédito gratis al mes**. Para un bot de Discord básico:
- Consumo aproximado: $3-4/mes
- Los $5 gratis son suficientes para mantenerlo 24/7

### Monitorear uso:
1. Ve a tu proyecto en Railway
2. Haz clic en "Usage" en la barra lateral
3. Verás cuánto has consumido del crédito mensual

## Solución de Problemas

### El bot no se conecta:
- Verifica que `DISCORD_TOKEN` y `APPLICATION_ID` estén correctos
- Revisa los logs en Railway para ver errores

### "Module not found":
- Asegúrate que `package.json` tenga todas las dependencias
- Railway ejecuta `npm install` automáticamente

### El bot se desconecta:
- Revisa los logs para ver el error
- Verifica que no hayas agotado los créditos gratuitos

### Errores de permisos:
- Verifica que el bot tenga los permisos necesarios en Discord
- Intents deben estar habilitados en Discord Developer Portal

## Comandos Útiles de Git

```bash
# Ver estado de archivos
git status

# Ver historial de commits
git log

# Deshacer cambios no guardados
git checkout -- archivo.js

# Ver diferencias
git diff

# Crear nueva rama
git checkout -b nueva-feature

# Cambiar de rama
git checkout main
```

## Archivos Importantes

- `railway.json` - Configuración de Railway
- `Procfile` - Define cómo iniciar el bot
- `.gitignore` - Archivos que NO se suben a GitHub
- `package.json` - Dependencias del proyecto

## Notas Importantes

1. **NUNCA subas tu `.env` a GitHub** - Contiene información sensible
2. **Usa variables de entorno en Railway** - Para tokens y IDs
3. **Los archivos en `data/` no persisten** - Railway puede reiniciar y perderlos
4. **Haz commits frecuentes** - Facilita revertir cambios si algo falla
5. **Monitorea tu uso** - Para no quedarte sin créditos

## Migrar Datos

Si tienes datos importantes en archivos JSON (config.json, warnings.json, etc.):

### Opción 1: Base de datos (Recomendado para producción)
- Railway ofrece PostgreSQL, MongoDB, Redis
- Migra tus datos JSON a una base de datos real

### Opción 2: Variables de entorno
- Para configuraciones pequeñas, usa variables de entorno

### Opción 3: Volúmenes persistentes (Railway Pro)
- Requiere plan de pago
- Mantiene archivos entre reinicios

## Soporte

- [Documentación de Railway](https://docs.railway.app)
- [Discord de Railway](https://discord.gg/railway)
- [Documentación de Discord.js](https://discord.js.org)

## Próximos Pasos

Una vez que tu bot esté corriendo en Railway:

1. Configura una base de datos para datos persistentes
2. Implementa sistema de backups
3. Monitorea el uso de recursos
4. Considera actualizar a Railway Pro si necesitas más recursos

---

¿Necesitas ayuda? Revisa los logs en Railway o contacta al soporte.
