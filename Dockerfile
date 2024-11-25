# Stage 1: Token Generator
FROM node:20

WORKDIR /app

# Set up Node app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build


CMD ["npm", "start"]
