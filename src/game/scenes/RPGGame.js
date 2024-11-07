import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { io } from "socket.io-client";


let player;
let cursors;
let socket;
const otherPlayers = {}
const PROXIMITY_THRESHOLD = 100; // Distance in pixels to trigger connection
const peerConnections = {}

export class RPGGame extends Scene {
    constructor() {
        super("RPGGame");
    }

    create() {

        for (let id in otherPlayers) {
            if (otherPlayers[id].label) {
                otherPlayers[id].label.destroy();
            }
            otherPlayers[id].destroy();
            delete otherPlayers[id];
        }

        socket = io("http://localhost:3000", {
            query: { username: this.game.username },
            reconnection: true,
            reconnectionDelay: 1000,
        });

        //webrtc
        socket.on("webrtc-offer",async(data)=>{
            if(!peerConnections[data.from]){
                await this.createPeerConnection(data.from)
            }
            const pc = peerConnections[data.from]
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer)
            console.log("answer")
            socket.emit("webrtc-answer",{
                answer:answer,
                to:data.from
            })
            
        })

        socket.on("webrtc-answer",async(data)=>{
            const pc = peerConnections[data.from]
            console.log(pc)
            if(pc){
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
                } catch (error) {
                    console.log(error)
                }
            }
        })

        socket.on("webrtc-ice-candidate",async(data)=>{
            const pc = peerConnections[data.from]
            if(pc){
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
        })




        socket.on("playerConnected", (data) => {
            console.log("Connected players:", data.players);
            // Clear existing players first
            for (let id in otherPlayers) {
                if (otherPlayers[id].label) {
                    otherPlayers[id].label.destroy();
                }
                otherPlayers[id].destroy();
                delete otherPlayers[id];
            }
            
            // Add all existing players
            for (const id in data.players) {
                if (id !== socket.id && data.players[id].username) {
                    this.addOtherPlayer(id, data.players[id]);
                }
            }
        });

        socket.on("playerMoved", (data) => {
            if (otherPlayers[data.id]) {
                otherPlayers[data.id].setPosition(data.x, data.y);
                if (data.animation) {
                    otherPlayers[data.id].anims.play(data.animation);
                }
                if (otherPlayers[data.id].label) {
                    otherPlayers[data.id].label.setPosition(data.x, data.y - 20);
                }
            }
        });

        socket.on("playerDisconnected", (id) => {
            if (otherPlayers[id]) {
                if (otherPlayers[id].label) {
                    otherPlayers[id].label.destroy();
                }
                otherPlayers[id].destroy();
                delete otherPlayers[id];
            }
            if (peerConnections[id]) {
                peerConnections[id].close();
                delete peerConnections[id];
            }
        });

        const map = this.make.tilemap({ key: "map" });

        const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
        const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
        const worldLayer = map.createLayer("World", tileset, 0, 0);
        const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

        player = this.physics.add.sprite(400, 350, "normal").setScale(1.5);
        this.label_score = this.add.text(player.x, player.y - 20, `${this.game.username}`, {
            font: "14px Arial",
            fill: "#ffffff",
            align: "center",
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5, 1);

        worldLayer.setCollisionByProperty({ collides: true });

        // Create animations for each direction
        this.anims.create({
            key: "walk-left",
            frames: this.anims.generateFrameNumbers("sprite-left", { start: 0, end: 4 }), // Row 1 frames
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "walk-right",
            frames: this.anims.generateFrameNumbers("sprite-right", { start: 0, end: 4 }), // Row 2 frames
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "walk-front",
            frames: this.anims.generateFrameNumbers("sprite-front", { start: 0, end: 4 }), // Row 3 frames
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "walk-back",
            frames: this.anims.generateFrameNumbers("sprite-back", { start: 0, end: 4 }), // Row 4 frames
            frameRate: 10,
            repeat: -1
        });

        // Create the cursors object to listen for arrow key inputs
        cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(player, worldLayer);
        player.setCollideWorldBounds(true)


    }
    createConnectionDiv(username)
    {
    if(!document.getElementById("connectionDiv")){
    const connectionDiv = document.createElement('div')
    connectionDiv.id = "connectionDiv"
    connectionDiv.style.position = "absolute"
    connectionDiv.style.bottom = "1%"
    connectionDiv.style.backgroundColor = "#252B4D"
    connectionDiv.style.left = "50%"
    connectionDiv.style.transform = 'translate(-50%, -50%)';
    connectionDiv.style.borderRadius = '20px'
    connectionDiv.style.padding = '10px'
    connectionDiv.style.width = "350px"
    connectionDiv.style.height = "30px"
    connectionDiv.style.display = "flex"
    connectionDiv.style.alignItems = "center"
    connectionDiv.style.justifyContent = "space-between"

    const leftDiv = document.createElement('div')
    leftDiv.style.display = "flex"
    leftDiv.style.gap = "15px"
    leftDiv.style.justifyContent = "center"
    leftDiv.style.alignItems = "center"
    //spriteDiv
    const spriteDiv = document.createElement('div')
    // spriteDiv.style.backgroundColor = "red"
    spriteDiv.style.display = "flex"
    spriteDiv.style.alignItems = "center"
    spriteDiv.style.justifyContent = "center"
    spriteDiv.style.paddingBottom = "12px"
    // spriteDiv.style.marginRight = "15px"
    const img = document.createElement('img')
    img.src = "../../../public/assets/tiled/misa-front.png"
    img.style.width = "20px"
    spriteDiv.appendChild(img)
    leftDiv.appendChild(spriteDiv)

    //peerName
    const peerDiv = document.createElement('div')
    peerDiv.style.display = "flex"
    peerDiv.style.flexDirection = "column"
    peerDiv.style.justifyContent = "center"
    // peerDiv.style.alignItems = "center"
    peerDiv.style.height = "30px"
    peerDiv.style.overflow = "hidden" // Add this
    // Remove the gap property
    
    const name = document.createElement('p')
    name.id = 'name'
    name.innerHTML = `${username}`
    name.style.fontSize = '15px'
    name.style.margin = '0' // Add this
    name.style.lineHeight = '1.2' // Add this
    
    const status = document.createElement('p')
    status.style.color = "grey"
    status.style.fontSize = '10px'
    status.style.margin = '0' // Add this
    status.style.lineHeight = '1.2' // Add this
    status.innerHTML = "Online"
    peerDiv.appendChild(name)
    peerDiv.appendChild(status)

    leftDiv.appendChild(peerDiv)
    connectionDiv.appendChild(leftDiv)

    const rightDiv = document.createElement('div')
    rightDiv.style.display = "flex"
    rightDiv.style.gap = "15px"
    rightDiv.style.justifyContent = "center"
    rightDiv.style.alignItems = "center"
    const mic = document.createElement('button')
    mic.style.backgroundColor = "transparent"
    mic.style.border = "none"
    mic.style.fontSize = "17px"
    mic.innerHTML = "🎙️"
    mic.onclick = () => this.toggleAudio();  // Only called when button is clicked

    const speaker = document.createElement('button')
    speaker.style.backgroundColor = "transparent"
    speaker.style.border = "none"
    speaker.style.fontSize = "17px"
    speaker.innerHTML = "🔊"
    speaker.on = ()=>this.toggleAudioOutput()
    const text = document.createElement('button')
    text.style.backgroundColor = "transparent"
    text.style.border = "none"
    text.style.fontSize = "17px"

    text.innerHTML = "💬"

    rightDiv.appendChild(mic)
    rightDiv.appendChild(speaker)
    rightDiv.appendChild(text)
    
    connectionDiv.appendChild(rightDiv)
    document.body.appendChild(connectionDiv)
    }
    else{
        document.getElementById("connectionDiv").style.opacity = 1
        document.getElementById("name").innerHTML = `${username}`
    }
    }


    async createPeerConnection(peerId) {
        console.log("Called")
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });
    
        // Debug connection state
        pc.onconnectionstatechange = () => {
            console.log(`Connection state change: ${pc.connectionState}`);
        };
    
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state: ${pc.iceConnectionState}`);
        };
    
        pc.onsignalingstatechange = () => {
            console.log(`Signaling state: ${pc.signalingState}`);
        };
    
        // Initialize audio state
        this.isAudioEnabled = false;
        this.localStream = null;
        this.audioTrack = null;
    
        // Debug track events
        pc.addEventListener('track',(ev)=>{
            console.log(`Track event: ${ev.track.kind} ${ev.track.id}`)
        })
        pc.ontrack = (event) => {
            console.log("Track received:", event);
            console.log("Track type:", event.track.kind);
            console.log("Streams:", event.streams);
            
            let remoteAudio

            if(!document.getElementById(`remote-audio-${peerId}`)){
                remoteAudio = document.createElement('audio');
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.id = `remote-audio-${peerId}`;
                remoteAudio.autoplay = true;
                document.body.appendChild(remoteAudio);

            }
            else{
                remoteAudio = document.getElementById(`remote-audio-${peerId}`)
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.id = `remote-audio-${peerId}`;
                remoteAudio.autoplay = true;
            }

    
            // Debug audio element
            remoteAudio.onloadedmetadata = () => {
                console.log("Audio element metadata loaded");
            };
    
            remoteAudio.onplay = () => {
                console.log("Audio started playing");
            };
    
            event.track.onmute = () => console.log("Track muted");
            event.track.onunmute = () => console.log("Track unmuted");
            event.track.onended = () => console.log("Track ended");
        };
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted");
            
            this.audioTrack = this.localStream.getAudioTracks()[0];
            this.audioTrack.enabled = true;
            this.isAudioEnabled = true;
            
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }

        // Modified toggleAudio function with better debugging
        
        // this.toggleAudio = async () => {
        //     try {
        //         if (!this.localStream) {
        //             console.log("Requesting microphone access...");
        //             this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //             console.log("Microphone access granted");
                    
        //             this.audioTrack = this.localStream.getAudioTracks()[0];
        //             this.audioTrack.enabled = true;
        //             this.isAudioEnabled = true;
                    
        //             this.localStream.getTracks().forEach(track => {
        //                 pc.addTrack(track, this.localStream);
        //             });
        //             // console.log("Adding track to peer connection",this.audioTrack);
        //             // this.audioTrack.forEach((track)=>{
        //             //     pc.addTrack(track,this.localStream)
        //             // })
        //             // pc.addTrack(this.audioTrack, this.localStream);
        //             // console.log("Track added:", sender);
    
        //             // Monitor track states
        //             this.audioTrack.onmute = () => console.log("Local track muted");
        //             this.audioTrack.onunmute = () => console.log("Local track unmuted");
        //             this.audioTrack.onended = () => console.log("Local track ended");
        //         } else {
        //             console.log("Toggling existing audio track");
        //             this.isAudioEnabled = !this.isAudioEnabled;
        //             this.audioTrack.enabled = this.isAudioEnabled;
        //             console.log("Audio enabled:", this.isAudioEnabled);
        //         }
    
        //         // Update mic button
        //         // const micButton = document.querySelector(`button:contains('🎙️')`);
        //         // if (micButton) {
        //         //     micButton.innerHTML = this.isAudioEnabled ? '🎙️' : '🎙️ (off)';
        //         // }
        //     } catch (error) {
        //         console.error("Error in toggleAudio:", error);
        //     }
        // };

        
    
        // Debug data channel
        const dataChannel = pc.createDataChannel("gameData");
        dataChannel.onopen = () => console.log("Data channel opened");
        dataChannel.onclose = () => console.log("Data channel closed");
        dataChannel.onerror = (error) => console.log("Data channel error:", error);
        dataChannel.onmessage = (event) => {
            console.log("Data channel message:", event.data);
        };
    
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate");
                socket.emit("webrtc-ice-candidate", {
                    candidate: event.candidate,
                    to: peerId
                });
            }
        };
    
        this.createConnectionDiv(otherPlayers[peerId].username);
    
        peerConnections[peerId] = pc;
        return pc;
    }


    async initializeWebRTCconnection(peerId) {
        if (!peerConnections[peerId]) {
            const pc = await this.createPeerConnection(peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
                offer: offer,
                to: peerId
            });
        }
    }


    checkProximity()
    {
        if(!player) return;
        for(const id in otherPlayers){
            const otherPlayer = otherPlayers[id]
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,otherPlayer.x,otherPlayer.y
            )

            if(distance <= PROXIMITY_THRESHOLD && !peerConnections[id]){
                this.initializeWebRTCconnection(id)
            }
            else if(distance>PROXIMITY_THRESHOLD && peerConnections[id]){
                document.getElementById("connectionDiv").style.opacity = 0
                peerConnections[id].close();
                delete peerConnections[id];
                console.log(peerConnections[id])
                const remoteAudio = document.querySelector(`remote-audio-${id}`);
                if (remoteAudio) {
                    remoteAudio.remove();
                }
            }
        }
    }

    update(time, delta) {
        player.body.setVelocity(0);
        let moving = false;
        let anim;

        // Check for directional input and play animations
        if (cursors.left.isDown) {
            player.body.setVelocityX(-100);
            player.anims.play("walk-left", true);
            moving = true
            anim = "walk-left";
        } else if (cursors.right.isDown) {
            player.body.setVelocityX(100);
            player.anims.play("walk-right", true);
            moving = true;
            anim = "walk-right"

        } else if (cursors.up.isDown) {
            player.body.setVelocityY(-100);
            player.anims.play("walk-back", true); // Changed "walk-up" to "walk-back"
            moving = true
            anim = "walk-back"

        } else if (cursors.down.isDown) {
            console.log("down")
            player.body.setVelocityY(100);
            player.anims.play("walk-front", true); // Changed "walk-down" to "walk-front"
            moving = true
            anim = "walk-front"

        } else {
            // Stop animation when no key is pressed
            player.anims.stop();

        }

        if(moving){
            socket.emit("playerMove",{x:player.x, y:player.y,animation:anim})
        }
        this.label_score.setPosition(player.x, player.y - 20);

        this.checkProximity();


    }

    addOtherPlayer(id, data) {
        // Check if player already exists
        if (otherPlayers[id]) {
            otherPlayers[id].label.destroy();
            otherPlayers[id].destroy();
        }

        // Only create player if we have valid data
        if (data && data.x !== undefined && data.y !== undefined && data.username) {
            const newPlayer = this.physics.add.sprite(data.x, data.y, 'normal').setScale(1.5);
            otherPlayers[id] = newPlayer;
            
            const label = this.add.text(data.x, data.y - 20, data.username, {
                font: "14px Arial",
                fill: "#ffffff",
                align: "center",
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5, 1);
            
            otherPlayers[id].label = label;
            otherPlayers[id].username = data.username;
        }
    }
    
}