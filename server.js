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

app.post("/upload", upload.single("audio"), (req, res) => {
  const input = req.file.path;
  const output = `uploads/voice-${Date.now()}.wav`;

  const log = (msg) => io.emit("log", msg);

  log("Áudio recebido com sucesso");

  // Pipeline: RNNoise (redução de ruído) + ganho automático + normalização
  const command = `
ffmpeg -y -i ${input} -af "
arnndn=m=rnnoise_model.rnn,
dynaudnorm=f=150:g=15,
acompressor=threshold=-18dB:ratio=4:attack=5:release=50:makeup=6
" ${output}
`;

  log("Iniciando redução de ruído...");
  log("Aplicando detecção automática da voz e volume adaptativo...");

  exec(command, (error) => {
    fs.unlinkSync(input);

    if (error) {
      log("Erro durante o processamento de áudio");
      console.error(error);
      return res.status(500).send("Erro no processamento de áudio");
    }

    log("Volume da voz ajustado com sucesso");
    log("Áudio limpo e natural pronto para reprodução e download");

    io.emit("done", { url: `/uploads/${path.basename(output)}` });
    res.json({ url: `/uploads/${path.basename(output)}` });
  });
});

// Servir uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
