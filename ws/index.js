const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const cors = require("cors");

app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", require("express-react-views").createEngine());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

let serverVariables = {
  numberOfUsers: 0,
};

let clientVaribles = {
  globalClicks: 0,
};

const users = [];
const commands = [];
const defaultRoom = "main";

app.get("/", (req, res) => {
  res.render("app", {
    numberOfUsers: serverVariables.numberOfUsers,
    users: users,
    commands: commands,
  });
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected to ${defaultRoom}`);
  socket.leave(socket.id); // disconnect auto-made room
  socket.join(defaultRoom); // join made room

  users.push({ id: socket.id, room: defaultRoom, time: socket.handshake.time });
  commands.push({
    user: socket.id,
    type: "connected",
    timeInit: new Date(),
  });

  serverVariables.numberOfUsers += 1;

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    socket.leave("main");
    const indexOfUser = users.findIndex((user) => user.id === socket.id);
    if (indexOfUser > -1) {
      users.splice(indexOfUser, 1);
      serverVariables.numberOfUsers -= 1;
      commands.push({
        user: socket.id,
        type: "disconnect",
        timeInit: new Date(),
      });
    }
  });

  socket.on("init", (arg, callback) => {
    callback(clientVaribles.globalClicks); // send back data to user who called it
    commands.push({
      user: socket.id,
      type: "init",
      timeInit: new Date(),
    });
  });

  socket.on("click", (arg, callback) => {
    clientVaribles.globalClicks += 1;
    io.emit("response", clientVaribles.globalClicks); // send to all users within global|room
    commands.push({
      user: socket.id,
      type: "click",
      timeInit: new Date(),
    });
  });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});

module.exports = io;
