# Stage 1: Token Generator
FROM quay.io/invidious/youtube-trusted-session-generator as token-generator

# Stage 2: Node App
FROM token-generator

# Set up Node environment
RUN apk add --no-cache nodejs npm


# Set up Node app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

CMD ["npm", "start"]
