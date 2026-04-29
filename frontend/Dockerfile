FROM node:20-alpine

WORKDIR /app

# copy only package manifests first to leverage Docker layer caching
COPY package*.json ./

# install dependencies inside the image (do not copy host node_modules)
RUN npm ci --silent

# copy rest of project
COPY . .

EXPOSE 3030

CMD ["npm", "run", "dev"]

