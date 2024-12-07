import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { io } from "socket.io-client";
import Peer from "peerjs";


let player;
let cursors;
let socket;
const otherPlayers = {}
const PROXIMITY_THRESHOLD = 100; // Distance in pixels to trigger connection
const peerConnections = {}
let localstream;
let myPeerJsID;
export class RPGGame extends Scene {
    constructor() {
        super("RPGGame");
        this.tryingConnection = false; // Indicates if a connection attempt is ongoing

        // this.connectionPairs = new Map(); // Map to store who is connected to whom  
    }

    create() {

        this.connection = false
        
        
        for (let id in otherPlayers) {
            if (otherPlayers[id].label) {
                otherPlayers[id].label.destroy();
            }
            otherPlayers[id].destroy();
            delete otherPlayers[id];
        }
        this.peer  = new Peer({
            host:'peerjs-server-2d-game-phasesj.onrender.com',
            path:"/peerjs",
            secure:true
        })

        console.log(this.peer,"peer")
        this.peer.on('open',async id => {
            console.log("peerjs connection made")
            myPeerJsID = id
            console.log(myPeerJsID)
            socket = await io("https://backend-2d-game-phaserjs.onrender.com", {
                query: { username: this.game.username, peerJSId:myPeerJsID },
                reconnection: true,
                reconnectionDelay: 1000,
            });


                            //webrtc

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
        socket.on("callEnded", (peerId) => {
            if (this.call) {
                this.handleCallEnd();
            }
        });


        socket.on("playerDisconnected", (id) => {
            if(this.call){
                this.call.close()
                this.call = null
                this.connection = false
                document.getElementById("connectionDiv").style.opacity = 0;

            }
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
    
        });


        

        this.peer.on('call', (call) => {
            console.log("receiving call")
            const {socketId} = call.metadata
            this.call = call    
            call.answer(this.localStream);
            this.tryingConnection = false
            this.connection = true
            this.createConnectionDiv(otherPlayers[socketId].username)
            call.on('stream', remoteStream => {
                this.addVideoStream(remoteStream);
            });
            call.on('close',()=>{
                this.handleCallEnd()
            })
        });

        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        }).then(stream => {
            this.localStream = stream;
            console.log(this.localStream)
        }).catch(error => {
            console.error('Error accessing media devices.', error);
        });


        const map = this.make.tilemap({ key: "map" });

        const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
        const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
        const worldLayer = map.createLayer("World", tileset, 0, 0);
        const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

        player = this.physics.add.sprite(400, 1050, "normal").setScale(1.5);
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
        this.myCam = this.cameras.main
        this.myCam.setBounds(0,0,this.game.config.width,1280)
        this.myCam.startFollow(player)
        this.physics.world.bounds.height = 1280;

        this.physics.add.collider(player, worldLayer);
        player.setCollideWorldBounds(true)
        

    }
    isMuted = false;

    toggleAudio() {
        if (!this.localStream) {
            console.error("Local stream not initialized");
            return;
        }
        
        const audioTracks = this.localStream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.error("No audio tracks available");
            return;
        }
    
        // Toggle the `enabled` property of each audio track
        this.isMuted = !this.isMuted;
        audioTracks.forEach(track => {
            track.enabled = !this.isMuted;
        });
        document.getElementById("micIcon").src = this.isMuted?"/assets/mute.png":"/assets/unmute.png"
        console.log(this.isMuted ? "Audio muted" : "Audio unmuted");
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
    img.src = "/assets/tiled/misa-front.png"
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
    mic.style.display = "flex"
    mic.style.alignItems = "center"
    mic.style.justifyContent = "center"
    const micIcon = document.createElement('img');
    micIcon.id = 'micIcon';
    micIcon.src = "/assets/unmute.png";  // Default image when mic is unmuted
    micIcon.style.width = "24px";  // Adjust width as needed
    micIcon.style.height = "24px"; // Adjust height as needed
    mic.appendChild(micIcon);

    // mic.innerHTML = this.isMuted?"🎙️":""
    mic.onclick = () => this.toggleAudio();  // Only called when button is clicked

    const speaker = document.createElement('button')
    speaker.style.backgroundColor = "transparent"
    speaker.style.border = "none"
    speaker.style.fontSize = "20px"
    speaker.innerHTML = "🔊"
    speaker.on = ()=>this.toggleAudioOutput()
    const text = document.createElement('button')
    text.style.backgroundColor = "transparent"
    text.style.border = "none"
    text.style.fontSize = "20px"

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



    addVideoStream(stream) {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.addEventListener('loadedmetadata', () => {
            audio.play();
        });
        document.body.append(audio);
    }

    async createPeerJsConnection(peerId) {
        // Check if the peer ID and local stream are defined
        if (!otherPlayers[peerId] || !otherPlayers[peerId].peerJSId) {
            console.error(`Peer ID ${peerId} not found or has no peerJSId`);
            return;
        }

        // console.log("inpeerjs",this.localStream)
        if (!this.localStream) {
            this.initializeLocalStream()
            console.error("Local stream is not initialized");
            return;
        }

        try {
            // Attempt to create a call to the other peer
            console.log(otherPlayers[peerId].peerJSId,"peerjsid")
            this.tryingConnection = true; // Set tryingConnection to true before attempting to call
            this.call = await this.peer.call(otherPlayers[peerId].peerJSId, this.localStream,{
                metadata:{
                    socketId: socket.id
                }
            });

            // Ensure the call object is valid before accessing `on`
            if (!this.call) {
                console.error("Failed to establish call.");
                return;
            }
            this.connection = true
            this.tryingConnection = false

            // socket.emit("onCall",{
            //     to: peerId,
            //     from:socket
            // })
            // Listen for the remote stream from the other peer
            this.call.on('stream', remoteStream => {
                this.addVideoStream(remoteStream);
            });
            // this.call.on('close',()=>{
            //     this.handleCallEnd();

            // })
            this.createConnectionDiv(otherPlayers[peerId].username)

        } catch (error) {
            console.error("Error establishing peer connection:", error);
            this.tryingConnection = false; // Reset if there’s an error

        }
    }


    handleCallEnd() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        if (this.call) {
            this.call.removeAllListeners()
            this.call.close();
            this.call = null;
            this.connection = false;
            this.tryingConnection = false
            const connectionDiv = document.getElementById("connectionDiv");
            if (connectionDiv) {
                connectionDiv.style.opacity = 0;
            }
        }
        this.initializeLocalStream();

    }
    initializeLocalStream() {
        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        }).then(stream => {
            this.localStream = stream;
            console.log("Local stream reinitialized");
        }).catch(error => {
            console.error('Error reinitializing media devices.', error);
        });
    }   


    checkProximity()
    {
        if(!player) return;
        for(const id in otherPlayers){
            const otherPlayer = otherPlayers[id]
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,otherPlayer.x,otherPlayer.y
            )

            if(distance <= PROXIMITY_THRESHOLD  && !this.connection && !this.tryingConnection){
                console.log("close")
                // this.tryingConnection = true
                this.createPeerJsConnection(id)
            }
            else if(distance>PROXIMITY_THRESHOLD && this.connection){
                this.endCall(id);

                // const remoteAudio = document.querySelector(`remote-audio-${id}`);
                // if (remoteAudio) {
                //     remoteAudio.remove();
                // }
            }
        }
    }
    endCall(peerId) {
        console.log("ending call");
        // Notify the other peer that the call is ending
        socket.emit("endCall", peerId);
        this.handleCallEnd();
        
        if (peerConnections[peerId]) {
            delete peerConnections[peerId];
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
            otherPlayers[id].peerJSId = data.peerJSId
            otherPlayers[id].username = data.username;
        }
    }
    
}