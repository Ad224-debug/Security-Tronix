# 🔧 Solución: Problemas con OneDrive y Git

## El Problema

Tu proyecto está en OneDrive (`C:\Users\julic\OneDrive\Documentos\BOT VEXOR`) y esto causa conflictos de permisos con Git.

## Solución Recomendada: Mover el Proyecto

### Opción 1: Mover a una carpeta local (RECOMENDADO)

1. **Crea una carpeta fuera de OneDrive:**
   ```
   C:\Proyectos\vexor-bot
   ```

2. **Copia todos los archivos del bot a la nueva carpeta**
   - Copia TODO excepto `node_modules/` (se reinstalará)

3. **Abre terminal en la nueva ubicación:**
   ```bash
   cd C:\Proyectos\vexor-bot
   ```

4. **Reinstala dependencias:**
   ```bash
   npm install
   ```

5. **Ahora sí, configura Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Vexor Bot"
   ```

### Opción 2: Pausar OneDrive temporalmente

1. **Click derecho en el ícono de OneDrive** (barra de tareas)
2. **Configuración** → **Pausar sincronización** → **2 horas**
3. **Espera 1 minuto** para que termine de sincronizar
4. **Ahora ejecuta los comandos de Git**

### Opción 3: Excluir la carpeta de OneDrive

1. **Click derecho en el ícono de OneDrive**
2. **Configuración** → **Cuenta** → **Elegir carpetas**
3. **Desmarca** la carpeta del bot
4. **Espera** a que OneDrive termine de procesar
5. **Ejecuta los comandos de Git**

---

## Después de Mover/Pausar OneDrive

### 1. Reinicia tu terminal
- Cierra PowerShell completamente
- Abre una nueva terminal
- Navega a la carpeta del bot

### 2. Verifica que Git funciona
```bash
git --version
```

### 3. Configura Git (primera vez)
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### 4. Inicializa el repositorio
```bash
git init
```

### 5. Agrega los archivos
```bash
git add .
```

### 6. Verifica qué se agregó
```bash
git status
```

Deberías ver archivos como:
- ✅ index.js
- ✅ package.json
- ✅ commands/
- ❌ NO debe aparecer .env
- ❌ NO debe aparecer node_modules/

### 7. Haz el commit
```bash
git commit -m "Initial commit - Vexor Bot"
```

---

## Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Nombre: `vexor-bot`
3. Privado: ✅
4. NO agregues README, .gitignore, ni license
5. Click en "Create repository"

---

## Conectar con GitHub

GitHub te mostrará estos comandos (cópialos de ahí):

```bash
git remote add origin https://github.com/TU_USUARIO/vexor-bot.git
git branch -M main
git push -u origin main
```

**Nota:** Te pedirá usuario y contraseña/token de GitHub.

---

## Si necesitas Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. "Generate new token" → "Generate new token (classic)"
3. Nombre: "Railway Deploy"
4. Permisos: Marca `repo` (todos)
5. "Generate token"
6. COPIA el token (no lo verás de nuevo)
7. Úsalo como contraseña cuando Git te lo pida

---

## Verificar que todo está bien

```bash
# Ver archivos rastreados
git ls-files

# Ver estado
git status

# Ver historial
git log --oneline
```

---

## Ahora ve a Railway

1. https://railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub repo
4. Selecciona "vexor-bot"
5. Agrega variables de entorno:
   - `DISCORD_TOKEN`
   - `APPLICATION_ID`
6. ¡Listo!

---

## Resumen de Comandos (en orden)

```bash
# 1. Navegar a la carpeta del bot
cd C:\Proyectos\vexor-bot

# 2. Configurar Git (solo primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# 3. Inicializar
git init

# 4. Agregar archivos
git add .

# 5. Verificar
git status

# 6. Commit
git commit -m "Initial commit - Vexor Bot"

# 7. Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/vexor-bot.git
git branch -M main
git push -u origin main
```

---

## ¿Sigues teniendo problemas?

Si después de mover la carpeta y reiniciar la terminal sigues teniendo problemas, usa **GitHub Desktop**:

1. Descarga: https://desktop.github.com/
2. Instala y haz login
3. File → Add Local Repository
4. Selecciona la carpeta del bot
5. Publish repository
6. ¡Listo!

---

**Recomendación:** Siempre trabaja con proyectos de desarrollo FUERA de OneDrive para evitar estos problemas.
