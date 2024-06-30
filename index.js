require('dotenv').config()
const fetch = require("node-fetch");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer();
  
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000","https://chessmastershub.vercel.app", "https://admin.socket.io", "http://localhost:8000"], // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection",async  (socket) => {
    // console.log("A user connected:", socket.id);

    socket.on('establish-conection',async (roomName,email)=>{
      // join room 
      if(!email) return ;
      socket.email=email;
      socket.roomName=roomName
      socket.join(roomName);
      // console.log('room and email',roomName,email);

      socket.emit("connection-established",{})

      socket.on("send_msg", async (data) => {
          io.in(data.roomId).emit("receive_msg", data);
      });
      socket.on("move", async (data) => {
        io.in(data.roomId).emit("moved",data);
      });

      socket.on("receive_draw_req", async (email,roomName) => {
        io.in(roomName).emit("receive_draw_req",email);    
      });

      socket.on("game_over", async (roomName,email) => {
          io.in(roomName).emit("game_over",email);  
      });

      socket.on("draw_accepted", async (email,roomName) => {
          io.in(roomName).emit("draw_accepted",email);    
      });

      socket.on('disconnect', async function () {
        socket.leave(roomName)
        console.log(email, 'user left room', roomName, 'with socket id', socket.id);
        let res=await fetch(`https://chessmastershub.vercel.app/api/setdisconnected`,{
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
        if(res.status===200){
          console.log(`${socket.email} is disconnected from ${socket.roomName}`);
        }
      });

    })
});

httpServer.listen(process.env.PORT || 3001, () => {
  console.log(`Socket.io server is running on port ${process.env.PORT || 3001}`);
});