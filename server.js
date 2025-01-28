const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let words = {}; // Armazena palavras e votos
let usersVoted = {}; // Armazena usuários que já votaram
let totalVotes = 0; // Conta o número de votos totais
let totalUsers = 0; // Total de usuários conectados

io.on("connection", (socket) => {
  totalUsers++;
  console.log(`Usuário conectado: ${socket.id}`);

  // Enviar palavras atuais e total de votos para o novo usuário
  socket.emit("updateWords", { words, totalVotes });

  // Adicionar nova palavra
  socket.on("addWord", (word) => {
    if (!words[word]) {
      words[word] = { votes: 0 };
      io.emit("updateWords", { words, totalVotes });
    }
  });

  // Votação em uma palavra
  socket.on("voteWord", (word) => {
    if (!usersVoted[socket.id] && words[word]) {
      words[word].votes++;
      usersVoted[socket.id] = true; // Marca o usuário como votado
      totalVotes++;
      io.emit("updateWords", { words, totalVotes });

      // Verifica se todos votaram
      if (totalVotes === totalUsers) {
        const winner = Object.keys(words).reduce((a, b) =>
          words[a].votes > words[b].votes ? a : b
        );
        io.emit("winner", winner);
      }
    }
  });

  socket.on("disconnect", () => {
    totalUsers--;
    console.log(`Usuário desconectado: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
