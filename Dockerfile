FROM node:18-bullseye

# Instalar ffmpeg e RNNoise
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

CMD ["node", "server.js"]
