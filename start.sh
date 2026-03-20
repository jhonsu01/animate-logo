#!/bin/bash
echo ""
echo "  ========================================"
echo "   AnimateLogo - Logo Animation Studio"
echo "  ========================================"
echo ""

cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js no encontrado. Instala Node.js desde https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias..."
    npm install
    echo ""
fi

echo "  Iniciando servidor..."
echo "  Abre http://localhost:3000 en tu navegador"
echo ""
node server.js
