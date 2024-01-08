const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const formateMessage = require("./utils/message");
const { userJoin, getRoomUsers, userLeave } = require("./utils/users");
// const { Client } = require("socket.io/dist/client");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

const bot = "ChatBot";

io.on("connection", (Client) => {
  Client.on("joinRoom", ({ username, room }) => {
    const user = userJoin(Client.id, username, room);

    Client.join(user.room);

    Client.emit("message", formateMessage(bot, "welcome to My chat"));

    Client.broadcast
      .to(user.room)
      .emit(
        "message",
        formateMessage(bot, `${user.username} has joined the chat`)
      );

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    Client.on("chatMessage", (msg) => {
      io.to(user.room).emit("message", formateMessage(user.username, msg));
    });

    Client.on("disconnect", () => {
      const user = userLeave(Client.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formateMessage(bot, `${user.username} has left the chat`)
        );

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });
});

const PORT = 8080 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
