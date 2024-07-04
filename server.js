// required libraries
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// from utlis modules
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Chatcord Bot";

// opening the connection
io.on('connection', socket => {

    socket.on("joinRoom", ({ username, room }) => {

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    
        // welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chatchord!')); // message to single client

    //Broadcast when a user connects. This message goes to everyone except the user.
    socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the chat.`));

    // send user and room info
    io.to(user.room).emit('roomUsers', {
        room:user.room,
        users:getRoomUsers(user.room)
    });

    });

    // Listen for chatMessage

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    //Brodacast when client disconnect
    socket.on('disconnect', () => {

        const user = userLeave(socket.id);

        if(user) {
            // this message is sent to all the user
            io.to(user.room).emit("message",formatMessage(botName, `${user.username} have left the chat.`));

        };

        // send user and room info
            io.to(user.room).emit('roomUsers', {
                room:user.room,
                users:getRoomUsers(user.room)
    })

        
    });

});

// describing port number 
const PORT = process.env.PORT || 3000 ;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));