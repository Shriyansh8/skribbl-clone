const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let rooms = {};

const words = [
  "apple",
  "car",
  "dog",
  "house",
  "tree",
  "phone",
  "pizza",
  "cat",
  "banana",
  "school",
  "computer",
  "football",
  "guitar",
  "mountain",
  "rocket",
];

io.on("connection", (socket) => {

  console.log("New user connected:", socket.id);

  socket.on("create_room", ({
    roomId,
    playerName,
  }) => {

    rooms[roomId] = {
      players: [],
      drawerIndex: 0,
      currentWord: "",
      scores: {},
      timeLeft: 60,
      defaultTime: 60,
      timer: null,
      round: 1,
      maxRounds: 3,
    };

    rooms[roomId].players.push({
      id: socket.id,
      name: playerName,
    });

    rooms[roomId].scores[playerName] = 0;

    socket.join(roomId);

    io.to(roomId).emit(
      "room_data",
      rooms[roomId]
    );

  });

  socket.on("join_room", ({
    roomId,
    playerName,
  }) => {

    if (!rooms[roomId]) return;

    rooms[roomId].players.push({
      id: socket.id,
      name: playerName,
    });

    rooms[roomId].scores[playerName] = 0;

    socket.join(roomId);

    io.to(roomId).emit(
      "room_data",
      rooms[roomId]
    );

  });

  socket.on("start_game", ({
    roomId,
    rounds,
    drawTime,
  }) => {

    const room = rooms[roomId];

    if (!room) return;

    room.maxRounds = rounds;

    room.defaultTime = drawTime;

    startRound(roomId);

  });

  socket.on("word_selected", ({
    roomId,
    selectedWord,
  }) => {

    const room = rooms[roomId];

    if (!room) return;

    room.currentWord = selectedWord;

    const drawer =
      room.players[room.drawerIndex];

    io.to(roomId).emit(
      "game_started",
      {
        drawerId: drawer.id,
        drawerName: drawer.name,
        word: selectedWord,
        scores: room.scores,
        timeLeft: room.timeLeft,
        round: room.round,
      }
    );

    clearInterval(room.timer);

    room.timer = setInterval(() => {

      room.timeLeft--;

      io.to(roomId).emit(
        "timer_update",
        room.timeLeft
      );

      if (room.timeLeft === 30) {

        let hint =
          room.currentWord[0] +
          "_ ".repeat(
            room.currentWord.length - 1
          );

        io.to(roomId).emit(
          "chat_message",
          {
            playerName: "SYSTEM",
            text: `Hint: ${hint}`,
          }
        );

      }

      if (room.timeLeft <= 0) {

        clearInterval(room.timer);

        io.to(roomId).emit(
          "chat_message",
          {
            playerName: "SYSTEM",
            text:
              `Round ended! Word was ${room.currentWord}`,
          }
        );

        nextRound(roomId);

      }

    }, 1000);

  });

  function startRound(roomId) {

    const room = rooms[roomId];

    if (!room) return;

    if (room.players.length < 2) {

      io.to(roomId).emit(
        "chat_message",
        {
          playerName: "SYSTEM",
          text:
            "Need at least 2 players to start.",
        }
      );

      return;

    }

    if (room.round > room.maxRounds) {

      let winner = "";

      let highestScore = 0;

      for (const player in room.scores) {

        if (
          room.scores[player] >
          highestScore
        ) {

          highestScore =
            room.scores[player];

          winner = player;

        }

      }

      io.to(roomId).emit(
        "game_over",
        {
          winner,
        }
      );

      return;

    }

    room.timeLeft =
      room.defaultTime;

    const drawer =
      room.players[room.drawerIndex];

    const shuffledWords = [...words]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    io.to(drawer.id).emit(
      "choose_word",
      shuffledWords
    );

  }

  function nextRound(roomId) {

    const room = rooms[roomId];

    if (!room) return;

    room.drawerIndex =
      (room.drawerIndex + 1) %
      room.players.length;

    room.round++;

    io.to(roomId).emit(
      "canvas_cleared"
    );

    startRound(roomId);

  }

  socket.on("draw_start", ({
    roomId,
    x,
    y,
    color,
    brushSize,
  }) => {

    socket.to(roomId).emit(
      "draw_data",
      {
        x,
        y,
        color,
        brushSize,
        type: "start",
      }
    );

  });

  socket.on("draw_move", ({
    roomId,
    x,
    y,
    color,
    brushSize,
  }) => {

    socket.to(roomId).emit(
      "draw_data",
      {
        x,
        y,
        color,
        brushSize,
        type: "move",
      }
    );

  });

  socket.on("draw_end", ({
    roomId,
  }) => {

    socket.to(roomId).emit(
      "draw_data",
      {
        type: "end",
      }
    );

  });

  socket.on("clear_canvas", ({
    roomId,
  }) => {

    socket.to(roomId).emit(
      "canvas_cleared"
    );

  });

  socket.on("draw_undo", ({
    roomId,
  }) => {

    socket.to(roomId).emit(
      "undo_last_stroke"
    );

  });

  socket.on("send_message", ({
    roomId,
    text,
    playerName,
  }) => {

    const room = rooms[roomId];

    if (!room) return;

    let messageData = {
      playerName,
      text,
    };

    if (
      text.toLowerCase().trim() ===
      room.currentWord.toLowerCase()
    ) {

      room.scores[playerName] += 10;

      messageData = {
        playerName: "SYSTEM",
        text:
          `${playerName} guessed the word correctly!`,
      };

      io.to(roomId).emit(
        "score_update",
        room.scores
      );

      clearInterval(room.timer);

      nextRound(roomId);

    }

    io.to(roomId).emit(
      "chat_message",
      messageData
    );

  });

  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      rooms[roomId].players =
        rooms[roomId].players.filter(
          (player) =>
            player.id !== socket.id
        );

      io.to(roomId).emit(
        "room_data",
        rooms[roomId]
      );

      if (
        rooms[roomId].players.length === 0
      ) {

        clearInterval(
          rooms[roomId].timer
        );

        delete rooms[roomId];

      }

    }

  });

});

server.listen(5000, () => {

  console.log(
    "Server running on port 5000"
  );

});