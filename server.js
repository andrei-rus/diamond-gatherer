const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PLAYER_DIM = 32;

http.listen(5000, function() {
  console.log('[SERVER STARTED AT PORT 5000]');
})

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
})

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
  console.log('[SOCKET CONNECTED]' + socket.id);

  socket.on('join-chat', function (userName) {
    console.log('[USER JOINED CHAT]', socket.id, userName);
    chatUsers[socket.id] = userName;
    socket.join('chat');
    socket.emit('joined-chat');
  })

  socket.on('send-message', function (message) {
    console.log('[USER SENT MESSAGE]', message);
    io.to('chat').emit('new-message', `${chatUsers[socket.id]}: ${message}`);
  })

  socket.on('leave-chat', function () {
    console.log('[USER LEFT CHAT]', socket.id);
    delete chatUsers[socket.id];
    socket.leave('chat');
    socket.emit('menu');
  })

  socket.on('create-game', function (gameName) {
    console.log('[NEW GAME CREATED]');
    const gameId = 'game-' + socket.id;
    const players = [new Player()];
    const game = new Game({
      id: gameId,
      players: players
    });
    games[gameId] = game;
    console.log('[User joined ' + gameId + '] room');
    socket.join(gameId);
  })
})

class Player {
  constructor() {
    this.x = 80;
    this.y = 127;
    this.dx = 0;
    this.dy = 0;
    this.imageId = 'space-ranger';
    this.direction = 'down';
    this.imageStartPoints = {
      right: [ 193, 225 ],
      left: [131, 161],
      down: [65, 98],
      up: [0, 33]
    };
  }

  forDraw() {
    return {
      imageId: this.imageId,
      drawImageParameters: [
        this.imageStartPoints[this.direction][0],
        0,
        PLAYER_DIM,
        PLAYER_DIM,
        this.x,
        this.y,
        PLAYER_DIM,
        PLAYER_DIM
      ]
    }
  }
}

class Game {
  constructor(options) {
    this.id = options.id
    this.players = options.players
    this.start();
  }

  start() {
    const that = this;
    setInterval(function () { gameLoop(that.id) }, 1000/60);
  }
}

function gameLoop(id) {
  const objectsForDraw = [];
  games[id].players.forEach(function (player) {
    objectsForDraw.push(player.forDraw());
  })
  io.to(id).emit('game-loop', objectsForDraw);
}


const chatUsers = {};
const games = {};
