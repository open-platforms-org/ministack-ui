#!/bin/bash
# Script para build e push das imagens no Docker Hub

set -e

TAG=${1:-"latest"}
BACKEND_IMAGE="ministack-ui/ministack-ui-backend"
FRONTEND_IMAGE="ministack-ui/ministack-ui-frontend"

echo "🐳 Building MiniStack UI images..."
echo "  Tag: $TAG"
echo ""

# Build backend
echo "📦 Building backend..."
docker build -t $BACKEND_IMAGE:$TAG ./backend
echo "✓ Backend built"

# Build frontend
echo "📦 Building frontend..."
docker build -t $FRONTEND_IMAGE:$TAG ./frontend
echo "✓ Frontend built"

# Push
echo ""
echo "🚀 Pushing to Docker Hub..."
docker push $BACKEND_IMAGE:$TAG
docker push $FRONTEND_IMAGE:$TAG

echo ""
echo "✅ Done! Images published:"
echo "  docker.io/$BACKEND_IMAGE:$TAG"
echo "  docker.io/$FRONTEND_IMAGE:$TAG"
echo ""
echo "Para usar em qualquer projeto, adicione ao docker-compose.yml:"
echo ""
echo "  ministack-ui-backend:"
echo "    image: $BACKEND_IMAGE:$TAG"
echo "    environment:"
echo "      - MINISTACK_ENDPOINT=http://ministack:4566"
echo "    ports:"
echo "      - \"3001:3001\""
echo "    networks:"
echo "      - sua-rede"
echo ""
echo "  ministack-ui-frontend:"
echo "    image: $FRONTEND_IMAGE:$TAG"
echo "    ports:"
echo "      - \"3030:3000\""
echo "    networks:"
echo "      - sua-rede"
