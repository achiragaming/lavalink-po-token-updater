# Stage 1: Token Generator
FROM quay.io/invidious/youtube-trusted-session-generator as token-generator

# Stage 2: Node App
FROM node:20

# Copy token generator binary from first stage
COPY --from=token-generator /usr/local/bin/youtube-trusted-session-generator /usr/local/bin/

# Set up Node app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

CMD ["npm", "start"]
