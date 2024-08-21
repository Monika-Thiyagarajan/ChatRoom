const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser, getRoomUsers, userLeave} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName = 'adminBot'
//run when client connects
io.on('connection',socket=>{
    console.log("socket connect");

    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)
        //welcome current user
        socket.emit('message',formatMessage(botName,'Welcome to ChatCord!'));
    
        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`));//all of clients except co
        
        //send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })
    })

    //Listen for chatmessage
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id)
        console.log(msg)
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    })
     //runs when client disconnects
     socket.on('disconnect',()=>{
        const user = userLeave(socket.id)
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`))
            //send users and room info
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            })
        }
    });
})
//io.emit() - all the clients
const PORT = 5000 || process.env.PORT;
server.listen(PORT,()=>console.log(`sever running on port ${PORT}`));
