import { log } from "console";
import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { BoxState } from "../src/state";

const app = express();
app.use(cors());

app.use("/", express.static("dist"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let state: BoxState[] = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("update", state);

  // Handle chat messages
  socket.on("update", (stateUpdate: BoxState) => {
    log("Received message:", stateUpdate);

    const newState = [
      ...state.filter(
        (s) => !(s.box == stateUpdate.box && s.saal == stateUpdate.saal)
      ),
    ];
    newState.push(stateUpdate);
    state = newState;

    io.emit("update", state); 
  });

  socket.on("cancel", (args: { saal: BoxState["saal"]; box: string }) => {
    log("Received cancel message:", args);

    const newState = [
      ...state.filter((s) => !(s.box == args.box && s.saal == args.saal)),
    ];

    state = newState;

    io.emit("update", state);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(3001, () => {
  console.log("WebSocket server listening on port 3001");
});
