import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { readdirSync } from "fs";

const morgan = require("morgan");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  path: "/socket.io",
  cors: {
    origin: [process.env.CLIENT_URL],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-type"],
  },
});

//db
mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB IS CONNECTED"))
  .catch((err) => console.log("DB CONNECTION ERROR", err));

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);
//socket io
// io.on("connect", (socket) => {
//   // console.log("Socket>IO", socket.id);
//   socket.on('send-message',(message)=>{
//     // console.log('new message recieved =>',message)
//     socket.broadcast.emit('receive message',message)
//   })
// });
io.on("connect", (socket) => {
  // console.log("Socket>IO", socket.id);
  socket.on("new-post", (newPost) => {
    // console.log('socket io new post =>',newPost)
    socket.broadcast.emit("new-post", newPost);
  });
});

readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
