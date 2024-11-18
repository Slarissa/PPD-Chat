const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express(); // Cria uma instância do Express.js
const server = http.createServer(app); // Cria um servidor HTTP usando o Express.js
const io = socketIO(server); // Cria uma instância do Socket.io vinculada ao servidor HTTP

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
}); // O servidor está ouvindo na porta 3000

app.use(express.static(path.join(__dirname, 'public'))); 

let rooms = {}; 

io.on('connection', (socket) => {
    console.log("Conexão detectada..."); 

    socket.on('join-room', (data) => {
        const { username, room } = data;

        socket.username = username;
        socket.room = room;

        // Adiciona o usuário à sala especificada
        socket.join(room);

        // Caso a sala não exista no objeto 'rooms', cria uma nova
        if (!rooms[room]) {
            rooms[room] = [];
        }

        // Adiciona o usuário à lista de usuários na sala
        rooms[room].push(username);

        // Notifica o cliente de que ele foi conectado com sucesso
        socket.emit('user-ok', {
            room: room,
            users: rooms[room] // Envia a lista completa de usuários para o cliente
        });

        // Notifica os outros usuários na sala sobre a chegada do novo usuário
        socket.broadcast.to(room).emit('user-joined', { username });
    });

    // Quando o usuário envia uma mensagem
    socket.on('send-msg', (data) => {
        const { message, room } = data; // Recebe a mensagem e a sala
        const username = socket.username; // Pega o nome do usuário

        // Emite a mensagem apenas para os outros usuários na sala (exceto para o remetente)
        socket.to(room).emit('show-msg', { username, message });
    });

    socket.on('leave-room', (room) => {
        socket.leave(room); // Remove o usuário da sala
        console.log(socket.username + ' deixou a sala ' + room);

        // Remove o usuário da lista de usuários da sala
        rooms[room] = rooms[room].filter(user => user !== socket.username);

        // Notifica a sala de que o usuário saiu
        socket.broadcast.to(room).emit('user-left', { username: socket.username });
    });

    socket.on('disconnect', () => {
        if (socket.room) {
            // Remove o usuário da sala na desconexão
            rooms[socket.room] = rooms[socket.room].filter(user => user !== socket.username);
            socket.broadcast.to(socket.room).emit('user-left', { username: socket.username });
        }
    });
});
