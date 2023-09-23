require('dotenv').config()

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://admin.socket.io/"], // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

    io.on("connection",async  (socket) => {
    console.log("A user connected:", socket.id);
    await socket.on('joinRoom', async (roomName,email) => {
      if(!email) return ;
      socket.email=email;
      socket.roomName=roomName
      await socket.join(roomName);
      console.log('room and email',roomName,email);
  });

  await socket.on("send_msg", async (data) => {
    console.log(data, "DATA");
    if(data.roomId){
      await io.to(data.roomId).emit("receive_msg", data);
    }
  });

  await socket.on("move", async (data) => {
    console.log("data",data);
   
    if(data.roomId){
      await io.to(data.roomId).emit("moved",data);
    }
  });

  await socket.on("receive_draw_req", async (email,roomName) => {
    console.log("email",email);
      await io.to(roomName).emit("receive_draw_req",email);    
  });

  await socket.on("game_over", async (roomName,email) => {
    console.log("email",email);
      await io.to(roomName).emit("game_over",email);  
  });

  await socket.on("draw_accepted", async (email,roomName) => {
    console.log("email",email);
      await io.to(roomName).emit("draw_accepted",email);    
  });

  socket.on('disconnect', async function () {
    let res=await fetch(`${process.env.SETDISCONNECT_URL}api/setdisconnected`,{
      method:'POST',
      headers:{
        'Access-Control-Allow-Origin': '*',
        Accept:"application/json",
        "Content-Type":"application/json"
      },
      credentials:'include',
      body:JSON.stringify({
        email:socket.email,
        roomName:socket.roomName
      })
    })
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});