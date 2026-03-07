# 🚂 Cómo Subir tu Bot a Railway (SIN Git instalado)

Esta guía te ayudará a subir tu bot a Railway usando solo la interfaz web de GitHub.

## Opción 1: Instalar Git (Recomendado)

1. Descarga Git desde: https://git-scm.com/download/win
2. Instala con las opciones por defecto
3. Reinicia tu terminal
4. Sigue la guía normal de RAILWAY_DEPLOYMENT_GUIDE.md

## Opción 2: Usar GitHub Desktop (Más Fácil)

### Paso 1: Instalar GitHub Desktop

1. Ve a: https://desktop.github.com/
2. Descarga e instala GitHub Desktop
3. Abre GitHub Desktop y haz login con tu cuenta de GitHub

### Paso 2: Crear Repositorio

1. En GitHub Desktop, haz clic en "File" → "New Repository"
2. Configura:
   - **Name:** vexor-bot
   - **Local Path:** Selecciona la carpeta donde está tu bot
   - **Initialize with README:** NO marcar (ya tienes archivos)
3. Haz clic en "Create Repository"

### Paso 3: Hacer Commit

1. GitHub Desktop mostrará todos tus archivos
2. Verifica que `.env` NO esté en la lista (debe estar ignorado)
3. En la esquina inferior izquierda:
   - **Summary:** "Initial commit - Vexor Bot"
   - **Description:** (opcional)
4. Haz clic en "Commit to main"

### Paso 4: Publicar en GitHub

1. Haz clic en "Publish repository" en la parte superior
2. Configura:
   - **Name:** vexor-bot
   - **Description:** Bot de Discord con moderación profesional
   - **Keep this code private:** ✅ Marca esto
3. Haz clic en "Publish Repository"

¡Listo! Tu código ya está en GitHub.

## Opción 3: Subir Manualmente (Sin Git)

### Paso 1: Preparar los Archivos

1. Crea una carpeta nueva llamada "vexor-bot-upload"
2. Copia TODOS los archivos de tu bot EXCEPTO:
   - `.env` (¡MUY IMPORTANTE!)
   - `node_modules/` (carpeta completa)
   - `data/` (carpeta completa)
   - `.vscode/` (carpeta completa)
   - `.kiro/` (carpeta completa)

### Paso 2: Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Configura:
   - **Repository name:** vexor-bot
   - **Description:** Bot de Discord con moderación profesional
   - **Private:** ✅ Selecciona esto
   - **Add a README:** NO marcar
3. Haz clic en "Create repository"

### Paso 3: Subir Archivos

1. En la página del repositorio, haz clic en "uploading an existing file"
2. Arrastra TODOS los archivos de la carpeta "vexor-bot-upload"
3. Espera a que se suban todos
4. En "Commit changes":
   - Escribe: "Initial commit - Vexor Bot"
5. Haz clic en "Commit changes"

¡Listo! Tu código ya está en GitHub.

---

## Ahora: Configurar Railway

### Paso 1: Crear Cuenta en Railway

1. Ve a: https://railway.app
2. Haz clic en "Login"
3. Selecciona "Login with GitHub"
4. Autoriza Railway para acceder a tus repositorios

### Paso 2: Crear Proyecto

1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona "vexor-bot"
4. Railway comenzará a detectar tu proyecto

### Paso 3: Configurar Variables de Entorno

**¡ESTO ES MUY IMPORTANTE!**

1. Haz clic en tu servicio (aparecerá como "vexor-bot")
2. Ve a la pestaña "Variables"
3. Haz clic en "New Variable"
4. Agrega estas variables:

**Variable 1:**
- **Variable:** `DISCORD_TOKEN`
- **Value:** (copia tu token del archivo .env)

**Variable 2:**
- **Variable:** `APPLICATION_ID`
- **Value:** (copia tu application ID del archivo .env)

### Cómo obtener estos valores:

1. Abre tu archivo `.env` local
2. Copia el valor después de `DISCORD_TOKEN=`
3. Pégalo en Railway
4. Repite con `APPLICATION_ID=`

### Paso 4: Verificar Configuración

1. Ve a "Settings" en tu servicio
2. Busca "Start Command"
3. Debería decir: `node index.js`
4. Si no, agrégalo manualmente

### Paso 5: Deploy

1. Railway deployará automáticamente
2. Ve a la pestaña "Deployments"
3. Haz clic en el deployment activo
4. Verás los logs en tiempo real
5. Espera a ver: `✅ Bot conectado como VEXOR BOT#1234`

### Paso 6: Verificar

1. Ve a tu servidor de Discord
2. Prueba un comando: `/botinfo`
3. Si funciona, ¡felicidades! 🎉

---

## Solución de Problemas

### "Module not found"
- Asegúrate de haber subido `package.json`
- Railway ejecuta `npm install` automáticamente

### "Invalid token"
- Verifica que copiaste bien el `DISCORD_TOKEN`
- No debe tener espacios ni comillas

### "Application not found"
- Verifica que copiaste bien el `APPLICATION_ID`
- Debe ser solo números

### Bot no responde
- Verifica que los Intents estén habilitados en Discord Developer Portal
- Ve a: https://discord.com/developers/applications
- Selecciona tu bot → Bot → Privileged Gateway Intents
- Activa: Presence, Server Members, Message Content

---

## Actualizar el Bot Después

### Con GitHub Desktop:
1. Haz cambios en tu código local
2. GitHub Desktop los detectará
3. Haz commit con un mensaje descriptivo
4. Haz clic en "Push origin"
5. Railway re-deployará automáticamente

### Sin Git:
1. Ve a tu repositorio en GitHub
2. Navega al archivo que quieres editar
3. Haz clic en el ícono del lápiz (Edit)
4. Haz los cambios
5. Haz clic en "Commit changes"
6. Railway re-deployará automáticamente

---

## Resumen Visual

```
Tu PC → GitHub → Railway → Discord
  ↓        ↓        ↓         ↓
Código   Repo    Deploy    Bot 24/7
```

---

## Necesitas Ayuda?

1. Revisa los logs en Railway (pestaña "Deployments")
2. Verifica las variables de entorno
3. Asegúrate que el token sea válido
4. Verifica que los Intents estén activados

¡Buena suerte! 🚀
