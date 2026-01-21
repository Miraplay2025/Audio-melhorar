const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("Cliente conectado");
});

// Endpoint de upload
app.post("/upload", upload.single("audio"), (req, res) => {
  const input = req.file.path;
  const output = `uploads/final-${Date.now()}.wav`;

  // Função para enviar logs em tempo real
  const log = (msg) => io.emit("log", msg);

  log("Áudio recebido com sucesso");

  const command = `
ffmpeg -y -i ${input} \
-af "
highpass=f=70,
lowpass=f=16000,
afftdn=nf=-30,
acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=3,
alimiter=limit=0.95,
loudnorm=I=-14:LRA=6:TP=-1
" \
${output}
`;

  log("Iniciando processamento de áudio...");

  exec(command, (error) => {
    fs.unlinkSync(input);

    if (error) {
      log("Erro durante o processamento");
      console.error(error);
      return res.status(500).send("Erro no processamento de áudio");
    }

    log("Volume atualizado com sucesso");
    log("Ruído reduzido com sucesso");
    log("Normalização finalizada");
    log("Áudio processado com sucesso!");

    // Envia caminho para o frontend
    io.emit("done", { url: `/uploads/${path.basename(output)}` });

    res.json({ url: `/uploads/${path.basename(output)}` });
  });
});

// Servir arquivos de uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
