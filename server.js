const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const User = require("./models/user.js");
const Room = require("./models/room.js");
const db = require("./db.js");
db();

const memberArray = [];

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/signup", async (req, res) => {
  // console.log(req.body.username);
  const { username, password, email } = req.body;
  try {
    const userDoc = await User.create({ username, password, email });
    res.send(userDoc);
  } catch (err) {
    res.send(err);
  }
});

app.post("/joinroom", async (req, res) => {
  try {
    const { roomId, users } = req.body;
    const existingRoom = await Room.findOne({ roomId: roomId });
    if (existingRoom) {
      const updatedRoom = await Room.findOneAndUpdate(
        {
          roomId: roomId,
        },
        { $addToSet: { users: users } },
        { new: true }
      );
      res
        .status(200)
        .json({ message: "user added to room", room: updatedRoom });
    } else {
      // console.log({ ujsers });
      const newRoom = new Room({
        roomId: roomId,
        users: users, // Add the provided users to the new room
      });
      const savedRoom = await newRoom.save();
      res
        .status(200)
        .json({ message: "New room created with users", room: savedRoom });
    }
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Error joining room" });
  }
});

app.post("/sendmessage", async (req, res) => {
  try {
    const { username, message, roomId, timeStamp } = req.body;
    // const timestamp=new Date();

    const newMessage = {
      timestamp: timeStamp,
      sender: username,
      content: message,
    };
    const updateMessage = await Room.findOneAndUpdate(
      { roomId: roomId },
      {
        $push: { messages: newMessage },
      },
      { new: true }
    );
    res.status(200).json({ updateMessage });
  } catch {
    res.status(500).json({ error: "Error sending message" });
  }
});

app.get("/getchats", async (req, res) => {
  try {
    const { roomId } = req.query;
    const getChats = await Room.findOne({ roomId });
    console.log(getChats);
    res.send(getChats);
  } catch {
    res.status(500).json({ error: "Unable to retrieve chats" });
  }
});

io.on("connection", (socket) => {
  console.log("Socket is connected");

  socket.on("joinroom", ({ userName, idValue: id }) => {
    socket.join(id);
    memberArray.push(userName);
    console.log(memberArray);
    io.to(id).emit("members", memberArray);

    socket.on("code", (code) => {
      console.log("the code is", code);
      socket.broadcast.to(id).emit("receive", code);
    });
    socket.on("message", ({ message, userName, timeStamp }) => {
      // console.log("the message is" + message + "by" + userName.username);
      const user = userName.username;
      io.to(id).emit("chat", { user, message, timeStamp });
    });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
