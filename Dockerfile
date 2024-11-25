# Stage 1: Token Generator
FROM quay.io/invidious/youtube-trusted-session-generator:webserver as token-generator-webserver

# Stage 2: Node App
FROM token-generator-webserver

# Set up Node environment
RUN apk add --no-cache nodejs npm


# Set up Node app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

CMD ["npm", "start"]
