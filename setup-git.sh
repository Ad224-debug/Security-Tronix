#!/bin/bash

echo "🚀 Configurando Git para Railway Deployment"
echo ""

# Verificar si git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instala Git primero."
    exit 1
fi

# Inicializar git si no existe
if [ ! -d .git ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    echo "✅ Repositorio inicializado"
else
    echo "✅ Repositorio Git ya existe"
fi

# Agregar todos los archivos
echo ""
echo "📝 Agregando archivos al staging..."
git add .

# Verificar que .env no esté en staging
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "⚠️  ADVERTENCIA: .env está en staging. Removiendo..."
    git rm --cached .env
fi

echo "✅ Archivos agregados"

# Hacer commit
echo ""
echo "💾 Creando commit inicial..."
git commit -m "Initial commit - Vexor Bot ready for Railway deployment"
echo "✅ Commit creado"

# Instrucciones para conectar con GitHub
echo ""
echo "🎯 Próximos pasos:"
echo ""
echo "1. Crea un repositorio en GitHub: https://github.com/new"
echo "2. Ejecuta estos comandos (reemplaza TU_USUARIO y TU_REPO):"
echo ""
echo "   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Ve a Railway.app y conecta tu repositorio"
echo ""
echo "✅ Git configurado correctamente!"
