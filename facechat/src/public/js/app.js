const socket = io();
const myPeer = new Peer();

const chat = document.getElementById("chat");
const nicknameForm = chat.querySelector("#nickname");
const messageForm = chat.querySelector("#message");
const ul = chat.querySelector("ul");

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

chat.hidden = true;
call.hidden = true;

let nickname = "ㅇㅇ";
let myStream;
let muted = false;
let cameraOff = false;
let roomName = "";
let myPeerConnection;

// Chat Code

function addMessage(msg) {
    let li = document.createElement("li");
    li.innerText = msg;
    ul.append(li);
}

nicknameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.emit("change_nickname", roomName, nickname, input.value);
    addMessage(`User ${nickname} changed name to ${input.value}`);
    nickname = input.value;
    alert(`Now, Your nickname is ${nickname}`);
    input.value = "";
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.emit("chat", roomName, nickname, input.value);
    addMessage(`You: ${input.value}`);
    input.value = "";
});

// Socket Code

socket.on("welcome", (peerId) => {
    addMessage('someone has joined');
    ConnectToPeer(peerId);
});

socket.on("change_nickname", (old_nickname, new_nickname) => {
    addMessage(`User ${old_nickname} changed name to ${new_nickname}`);
});

socket.on("chat", (user, msg) => {
    addMessage(`${user}: ${msg}`);
})

socket.on("bye", () => {
    addMessage("someone has left");
});

// Call media Code

async function getCameras () {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option  = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;   

        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

muteBtn.addEventListener("click", () => {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
});

cameraBtn.addEventListener("click", () => {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
});

camerasSelect.addEventListener("input", async () => {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
});

// Welcome Form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall () {
    welcome.hidden = true;
    call.hidden = false;
    chat.hidden = false;
    await getMedia();
    
    myPeer.on("call", (call) => {
        call.answer(myStream);
        call.on("stream", (peerStream) => {
            const peerFace = document.getElementById("peerFace");
            peerFace.srcObject = peerStream;
        });
    });     
}

welcomeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join room", input.value, myPeer.id);
    roomName = input.value;
    input.value = "";
});

// Peer Code

async function ConnectToPeer(peerId) {
    const peerFace = document.getElementById("peerFace");
    const call = await myPeer.call(peerId, myStream);

    call.on("stream", (peerStream) => {
        peerFace.srcObject = peerStream;
    })

    call.on("close", () => {
        peerFace.srcObject = null;
    });
}