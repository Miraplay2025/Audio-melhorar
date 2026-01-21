const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 3000;

/* Pastas estáticas */
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* Logs em tempo real */
const log = msg => io.emit("log", msg);

/* Upload e processamento */
app.post("/upload", upload.single("audio"), (req, res) => {
  const input = req.file.path;
  const output = `uploads/narracao-youtube-${Date.now()}.wav`;

  log("Áudio recebido com sucesso");
  log("Otimizando áudio para narração YouTube...");
  log("Aplicando limpeza segura (voz preservada)...");
  log("Ajustando volume automaticamente...");

  /*
    PIPELINE SEGURO:
    - NÃO remove voz
    - NÃO remove silêncio
    - NÃO usa gate
    - NÃO usa RNNoise
  */
  const command = `
ffmpeg -y -i "${input}" -af "
highpass=f=80,
lowpass=f=16000,
afftdn=nf=-20,
dynaudnorm=f=300:g=10,
acompressor=threshold=-18dB:ratio=3:attack=20:release=200:makeup=3
" "${output}"
`;

  exec(command, (err, stdout, stderr) => {
    fs.unlink(input, () => {});

    if (err) {
      console.error(stderr);
      log("Erro no processamento do áudio");
      return res.status(500).json({ error: "Falha no processamento" });
    }

    log("Ruído reduzido com segurança");
    log("Voz preservada e natural");
    log("Áudio pronto para uso no YouTube");

    io.emit("done", { url: "/" + output });
    res.json({ url: "/" + output });
  });
});

/* Servidor */
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
