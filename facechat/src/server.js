import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(io, {
    auth: false
});

function publicRooms() {
    const {
        sockets: {
            adapter: {sids, rooms}
        }
    } = io;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

io.on("connection", (socket) => {
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });

    socket.on("join room", (roomName, peerId) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome", peerId);
    });

    socket.on("change_nickname", (roomName, old_nickname, new_nickname) => {
        socket.to(roomName).emit("change_nickname", old_nickname, new_nickname);
    });

    socket.on("chat", (roomName, user, msg) => {
        socket.to(roomName).emit("chat", user, msg);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye"));
    });

    socket.on("disconnect", () => {
        io.sockets.emit("room_change", publicRooms());
    });
});

server.listen(3000, () => {
    console.log("Listening on http://localhost:3000");
});