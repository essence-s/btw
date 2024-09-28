FROM node:20.17.0-alpine3.20 as swbot
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache ffmpeg && \
    npm install --only=production && \
    npm cache clean --force
COPY . .
CMD ["npm", "start"]