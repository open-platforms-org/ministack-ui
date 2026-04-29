# MiniStack UI

UI web para inspecionar serviços AWS locais rodando no [MiniStack](https://github.com/ministackorg/ministack).

## Serviços suportados
- 🗃️ DynamoDB — tabelas, itens, GSIs
- 🪣 S3 — buckets, objetos, download
- 📨 SQS — filas, mensagens, enviar, purgar
- 📢 SNS — tópicos, assinaturas, publicar
- 🐘 RDS — instâncias, clusters, start/stop
- ⚡ Lambda — funções, invocar, logs, event sources

---

## Como usar em qualquer projeto

### Pré-requisito
Seu projeto precisa ter o MiniStack (ou LocalStack) rodando em uma rede Docker.

### 1. Descubra o nome da rede Docker do seu projeto

```bash
docker network ls
# Ex: meu-projeto_default, dockerfiles_core-network
```

### 2. Adicione ao `docker-compose.yml` do seu projeto

```yaml
services:
  ministack-ui-backend:
    image: seunome/ministack-ui-backend:latest
    container_name: ministack-ui-backend
    environment:
      - MINISTACK_ENDPOINT=http://ministack:4566  # nome do container do MiniStack
      - AWS_REGION=us-east-1
    ports:
      - "3001:3001"
    networks:
      - sua-rede  # mesma rede do MiniStack

  ministack-ui-frontend:
    image: seunome/ministack-ui-frontend:latest
    container_name: ministack-ui-frontend
    ports:
      - "3030:3000"
    depends_on:
      - ministack-ui-backend
    networks:
      - sua-rede
```

### 3. Suba

```bash
docker-compose up -d
# Acesse: http://localhost:3030
```

---

## Desenvolvimento (rodar localmente)

```bash
git clone https://github.com/seunome/ministack-ui
cd ministack-ui

# Copiar e ajustar variáveis
cp .env.example .env

# Subir
docker-compose up --build
```

---

## Publicar imagens no Docker Hub

```bash
# Faça login
docker login

# Build e push
chmod +x publish.sh
./publish.sh seunome latest
```

