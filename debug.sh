#!/bin/bash

echo "⏳ Añadiendo archivos..."
git add .

echo "📝 Haciendo commit de debug..."
git commit -m "debug: revisión tras actualización"

echo "🚀 Enviando a GitHub..."
git push origin main

echo "✅ Listo. Ahora visita tu proyecto en Vercel para verificar los cambios."
