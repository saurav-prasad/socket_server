const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
require('dotenv').config()


const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000

const io = new Server(server, {
    cors: {
        origin: "*"
    },
})

console.log(port);
// Mapping between user IDs and socket IDs
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected')

    socket.on("online", (userId) => {
        // console.log(userId);
        // const a = { ...users, receiver: userId }
        if (userId) {
            users[userId] = socket.id
            console.log(Object.keys(users));
            io.emit('get-online-users', Object.keys(users))
        }
    })


    socket.on('join', ({ userId, roomId }) => {
        console.log({ userId, roomId });
        console.log("room join");
        // Associate the user ID with the socket ID
        if (userId) { users[userId] = socket.id; }
        // Join the room
        roomId && socket.join(roomId);
    });

    socket.on('private-message', (data) => {
        console.log(users);
        const { sender, receiver, message } = data;
        const receiverSocketId = users[receiver];
        if (receiverSocketId) {
            // Send the private message to the receiver
            io.to(receiverSocketId).emit('private-message', { sender, message });
        } else {
            // Handle the case where the receiver is not online
            console.log(`User ${receiver} is not online`);
        }
    });

    socket.on('group-message', (data) => {
        const { sender, roomId, message } = data;
        // Send the group message to all users in the room
        io.to(roomId).emit('group-message', { sender, message });
    });

    socket.on('leave-group', (roomId) => {
        // Remove the user from the specified group
        socket.leave(roomId);
        console.log(`User ${socket.id} left group ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');

        // Find the user that is disconnecting based on their socket ID
        const disconnectedUser = Object.keys(users).find(
            (key) => users[key] === socket.id
        );

        if (disconnectedUser) {
            // Remove the user from the users object
            delete users[disconnectedUser];

            // Notify other users about the disconnection
            io.emit('disconnected-user', disconnectedUser);
        }

        console.log('disconnected userid', socket.id);
    });

});

// server initialization
server.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
})  

