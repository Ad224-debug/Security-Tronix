@echo off
echo 🚀 Configurando Git para Railway Deployment
echo.

REM Verificar si git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git no está instalado. Por favor instala Git primero.
    echo Descarga Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Inicializar git si no existe
if not exist .git (
    echo 📦 Inicializando repositorio Git...
    git init
    echo ✅ Repositorio inicializado
) else (
    echo ✅ Repositorio Git ya existe
)

echo.
echo 📝 Agregando archivos al staging...
git add .

REM Verificar que .env no esté en staging
git ls-files --error-unmatch .env >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  ADVERTENCIA: .env está en staging. Removiendo...
    git rm --cached .env
)

echo ✅ Archivos agregados

REM Hacer commit
echo.
echo 💾 Creando commit inicial...
git commit -m "Initial commit - Vexor Bot ready for Railway deployment"
echo ✅ Commit creado

REM Instrucciones para conectar con GitHub
echo.
echo 🎯 Próximos pasos:
echo.
echo 1. Crea un repositorio en GitHub: https://github.com/new
echo 2. Ejecuta estos comandos (reemplaza TU_USUARIO y TU_REPO):
echo.
echo    git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Ve a Railway.app y conecta tu repositorio
echo.
echo ✅ Git configurado correctamente!
echo.
pause
