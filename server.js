import express from "express";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/processed", express.static("processed"));

const upload = multer({ dest: "uploads/" });

io.on("connection", socket => {
  console.log("Cliente conectado");
});

app.post("/upload", upload.single("audio"), (req, res) => {
  const socketId = req.headers["socket-id"];
  const socket = io.sockets.sockets.get(socketId);

  const input = req.file.path;
  const output = `processed/${Date.now()}_final.m4a`;

  socket.emit("log", "🎧 Processando áudio...");

  const cmd = `
  ffmpeg -y -i ${input} -af "
  highpass=f=80,
  lowpass=f=12000,
  equalizer=f=300:width_type=o:width=1:g=-4,
  equalizer=f=3000:width_type=o:width=1:g=5,
  acompressor=threshold=-18dB:ratio=3:attack=5:release=100:makeup=4,
  alimiter=limit=-1dB,
  loudnorm=I=-14:LRA=11:TP=-1.5
  " -c:a aac -b:a 192k ${output}
  `;

  exec(cmd, (err) => {
    fs.unlinkSync(input);

    if (err) {
      socket.emit("log", "❌ Erro no processamento");
      return res.sendStatus(500);
    }

    socket.emit("log", "✅ Áudio pronto!");
    socket.emit("done", `/${output}`);
    res.sendStatus(200);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
