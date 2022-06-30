const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 8080;

let _usersConnected = [];

io.on('connection', (socket) => {
  let { id } = socket.client;

  socket.on('user nickname', (nickname) => {
    _usersConnected.push({
      nickname,
      clientId: id,
      socketId: socket.id,
    });

    io.emit('users-on', [..._usersConnected.map((u) => u.nickname)]);

    socket.broadcast.emit('welcome', nickname);
  });

  socket.on('chat message', ({ from, msg }) => {
    socket.broadcast.emit('chat message', { from, msg });
  });

  socket.on('chat message private', ({ to, from, msg }) => {
    const _to = _usersConnected.find((u) => u.nickname === to);
    io.to(_to.socketId).emit('private msg', { id, from, msg });
  });

  socket.on('disconnect', () => {
    let tempUserNickname;

    _usersConnected = [
      ..._usersConnected.filter(
        (u) => !(u.clientId === id && (tempUserNickname = u.nickname))
      ),
    ];

    console.log(_usersConnected, tempUserNickname);

    socket.broadcast.emit('user-disconnected', tempUserNickname);
    io.emit('users-on', [..._usersConnected.map((u) => u.nickname)]);
  });
});

server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));
