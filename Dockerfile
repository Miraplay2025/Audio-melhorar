FROM node:18-bullseye

# Instalar ffmpeg e wget
RUN apt-get update && apt-get install -y ffmpeg wget

WORKDIR /app

# Baixar modelo RNNoise automaticamente
RUN mkdir -p rnnoise && \
    wget https://github.com/xiph/rnnoise/raw/master/example/rnnoise_model.rnn -O rnnoise/rnnoise_model.rnn

COPY package.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

CMD ["node", "server.js"]
