import express from "express";
import multer from "multer";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/processed", express.static("processed"));

const upload = multer({ dest: "uploads/" });

io.on("connection", socket => {
  socket.emit("log", "🎧 Sistema de áudio profissional conectado");
});

app.post("/upload", upload.single("audio"), (req, res) => {
  const input = req.file.path;
  const output = `processed/voice-${Date.now()}.wav`;

  const ffmpegCommand = `
ffmpeg -y -i ${input} \
-af "
highpass=f=80,
equalizer=f=300:t=q:w=1:g=3,
equalizer=f=3000:t=q:w=1:g=4,
acompressor=threshold=-18dB:ratio=4:attack=5:release=50,
loudnorm=I=-14:TP=-1.5:LRA=11,
alimiter=limit=0.98
" ${output}
`;

  io.emit("log", "🧠 Aplicando IA de áudio...");
  io.emit("log", "🔊 Ajustando volume, clareza e presença");

  exec(ffmpegCommand, err => {
    fs.unlinkSync(input);

    if (err) {
      io.emit("log", "❌ Erro no processamento");
      return res.sendStatus(500);
    }

    io.emit("log", "✅ Áudio profissional finalizado!");
    io.emit("done", { url: `/${output}` });

    res.sendStatus(200);
  });
});

server.listen(3000, () =>
  console.log("🚀 Servidor rodando na porta 3000")
);
