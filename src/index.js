const express = require('express');
const cors = require('cors');
const https = require('http');
const fs = require('fs');

const app = express();
app.use(cors);

let queue = [];

// initialize a simple http server
const server = https.createServer({
  //key: fs.readFileSync('./privkey.pem'),
  //cert: fs.readFileSync('./cert.pem'),
}, app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
  client.on('message', (message) => {
    console.log('received: %s', message);
  });

  io.emit('init-queue', queue);

  client.on('auth', (message) => {
    console.log(message);
    if (message.name !== 'Marc') {
      const tmpObj = {
        name: message.name,
        id: queue.length + 1,
      };
      queue.push(tmpObj);
      io.emit('add-user', tmpObj);
    } else {
      io.emit('add-user', 'admin');
    }
  });

  client.on('remove', (message) => {
    queue = queue.filter((user) => user.id !== message.id);
    io.emit('init-queue', queue);
  });

  client.on('message', (message) => {
    console.log('received: %s', message);
  });
});
// start our server
server.listen(3001, () => {
  console.log('Server started on port 3001 :)');
});
