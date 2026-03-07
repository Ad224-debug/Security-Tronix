# 🚀 Pasos para Subir a Railway - GUÍA RÁPIDA

## ⚠️ IMPORTANTE: Reinicia tu terminal primero

Después de instalar Git, debes cerrar y abrir de nuevo tu terminal para que funcione.

---

## Paso 1: Configurar Git (Primera vez)

Abre una nueva terminal y ejecuta estos comandos (reemplaza con tu información):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

---

## Paso 2: Inicializar Git en tu Proyecto

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit - Vexor Bot"
```

---

## Paso 3: Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Configura:
   - **Repository name:** vexor-bot
   - **Description:** Bot de Discord con moderación profesional
   - **Private:** ✅ Marca esto
   - **NO marques:** Add a README, .gitignore, o license
3. Haz clic en "Create repository"

---

## Paso 4: Conectar con GitHub

GitHub te mostrará comandos. Usa estos (reemplaza TU_USUARIO):

```bash
git remote add origin https://github.com/TU_USUARIO/vexor-bot.git
git branch -M main
git push -u origin main
```

**Nota:** Te pedirá tu usuario y contraseña de GitHub. Si tienes 2FA activado, necesitarás un Personal Access Token en lugar de tu contraseña.

### Crear Personal Access Token (si es necesario):
1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Nombre: "Railway Bot Deploy"
4. Selecciona: `repo` (todos los permisos de repositorio)
5. Click en "Generate token"
6. COPIA el token (no podrás verlo de nuevo)
7. Usa este token como contraseña cuando Git te lo pida

---

## Paso 5: Configurar Railway

### 5.1 Crear cuenta
1. Ve a: https://railway.app
2. Click en "Login"
3. Selecciona "Login with GitHub"
4. Autoriza Railway

### 5.2 Crear proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona "vexor-bot"
4. Railway comenzará a detectar tu proyecto

### 5.3 Configurar Variables de Entorno (MUY IMPORTANTE)

1. Click en tu servicio (vexor-bot)
2. Ve a la pestaña "Variables"
3. Click en "New Variable"

**Agrega estas 2 variables:**

Variable 1:
- Name: `DISCORD_TOKEN`
- Value: (copia de tu archivo .env, sin comillas)

Variable 2:
- Name: `APPLICATION_ID`
- Value: (copia de tu archivo .env, sin comillas)

### 5.4 Verificar Start Command

1. Ve a "Settings"
2. Busca "Start Command"
3. Debe decir: `node index.js`

---

## Paso 6: Deploy y Verificar

1. Railway deployará automáticamente
2. Ve a "Deployments" → Click en el deployment activo
3. Verás los logs
4. Espera a ver: `✅ Bot conectado como VEXOR BOT#1234`
5. Prueba en Discord: `/botinfo`

---

## 🎉 ¡Listo!

Tu bot ahora está corriendo 24/7 en Railway.

---

## Actualizar el Bot en el Futuro

Cuando hagas cambios en tu código:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Railway detectará los cambios y re-deployará automáticamente.

---

## Comandos Git Útiles

```bash
# Ver estado de archivos
git status

# Ver qué archivos están siendo rastreados
git ls-files

# Remover archivo del staging (si agregaste algo por error)
git rm --cached archivo.js

# Ver historial de commits
git log --oneline
```

---

## Solución de Problemas

### Git no funciona después de instalar
- Cierra y abre de nuevo tu terminal
- O reinicia tu computadora

### "Permission denied" al hacer push
- Necesitas un Personal Access Token (ver Paso 4)

### ".env está en el repositorio"
```bash
git rm --cached .env
git commit -m "Remove .env from repository"
git push
```

### "Bot no se conecta en Railway"
- Verifica las variables de entorno
- Revisa los logs en Railway
- Asegúrate que el token sea válido

---

## Archivos que NO deben subirse a GitHub

✅ Ya están en `.gitignore`:
- `.env` (tu token)
- `node_modules/` (dependencias)
- `data/` (datos locales)
- `config.json` (configuración local)

---

## Monitorear Uso de Railway

1. Ve a tu proyecto en Railway
2. Click en "Usage" en la barra lateral
3. Verás cuánto has consumido de los $5 gratis

**Consumo típico:** $3-4/mes para un bot básico

---

¿Necesitas ayuda? Revisa los logs en Railway o verifica las variables de entorno.
