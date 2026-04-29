#!/bin/bash
# Script para build e push das imagens no Docker Hub

set -e

DOCKER_USER=${1:-"seunome"}
TAG=${2:-"latest"}

echo "🐳 Building MiniStack UI images..."
echo "  Docker Hub user: $DOCKER_USER"
echo "  Tag: $TAG"
echo ""

# Build backend
echo "📦 Building backend..."
docker build -t $DOCKER_USER/ministack-ui-backend:$TAG ./backend
echo "✓ Backend built"

# Build frontend
echo "📦 Building frontend..."
docker build -t $DOCKER_USER/ministack-ui-frontend:$TAG ./frontend
echo "✓ Frontend built"

# Push
echo ""
echo "🚀 Pushing to Docker Hub..."
docker push $DOCKER_USER/ministack-ui-backend:$TAG
docker push $DOCKER_USER/ministack-ui-frontend:$TAG

echo ""
echo "✅ Done! Images published:"
echo "  docker.io/$DOCKER_USER/ministack-ui-backend:$TAG"
echo "  docker.io/$DOCKER_USER/ministack-ui-frontend:$TAG"
echo ""
echo "Para usar em qualquer projeto, adicione ao docker-compose.yml:"
echo ""
echo "  ministack-ui-backend:"
echo "    image: $DOCKER_USER/ministack-ui-backend:$TAG"
echo "    environment:"
echo "      - MINISTACK_ENDPOINT=http://ministack:4566"
echo "    ports:"
echo "      - \"3001:3001\""
echo "    networks:"
echo "      - sua-rede"
echo ""
echo "  ministack-ui-frontend:"
echo "    image: $DOCKER_USER/ministack-ui-frontend:$TAG"
echo "    ports:"
echo "      - \"3030:3000\""
echo "    networks:"
echo "      - sua-rede"

