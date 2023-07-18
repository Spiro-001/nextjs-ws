const express = require("express");
const app = express();
const path = require("path");
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

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

let serverVariables = {
  numberOfUsers: 0,
};

let clientVaribles = {
  globalClicks: 0,
};

app.get("/", (req, res) => {
  res.render("app", { numberOfUsers: serverVariables.numberOfUsers });
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  serverVariables.numberOfUsers += 1;
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
  socket.on("init", (arg, callback) => {
    callback(clientVaribles.globalClicks); // send back data to user who called it
  });
  socket.on("click", (arg, callback) => {
    clientVaribles.globalClicks += 1;
    io.emit("response", clientVaribles.globalClicks); // send to all users within global|room
  });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
