const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const log = msg => io.emit("log", msg);

app.post("/upload", upload.single("audio"), (req, res) => {
  const input = req.file.path;
  const output = `uploads/narracao-youtube-${Date.now()}.wav`;

  log("Áudio recebido com sucesso");
  log("Preparando narração para padrão YouTube...");
  log("Reduzindo ruído de fundo sem afetar a voz...");
  log("Ajustando volume automaticamente...");

  const command = `
ffmpeg -y -i ${input} -af "
highpass=f=80,
lowpass=f=16000,
agate=threshold=-48dB:ratio=2:attack=25:release=300,
dynaudnorm=f=400:g=8,
acompressor=threshold=-18dB:ratio=3:attack=20:release=200:makeup=2
" ${output}
`;

  exec(command, err => {
    fs.unlinkSync(input);

    if (err) {
      log("Erro durante o processamento de áudio");
      console.error(err);
      return res.status(500).end();
    }

    log("Ruído reduzido");
    log("Voz equilibrada e natural");
    log("Áudio pronto para YouTube 🎉");

    io.emit("done", { url: "/" + output });
    res.json({ url: "/" + output });
  });
});

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
