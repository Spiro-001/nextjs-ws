const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const cors = require("cors");

app.use(cors());

app.get("/", (req, res) => {
  res.send("Connected");
});

let globalClicks = 0;

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("init", (arg, callback) => {
    callback(globalClicks); // send back data to user who called it
  });
  socket.on("click", (arg, callback) => {
    globalClicks += 1;
    io.emit("response", globalClicks); // send to all users within global|room
  });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
