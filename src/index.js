const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors);

const queuePath = './queue.json';
let queue = JSON.parse(fs.readFileSync(queuePath));

// initialize a simple http server
const server = https.createServer({
  key: fs.readFileSync(`${process.env.CERTS_DIR}privkey.pem`),
  cert: fs.readFileSync(`${process.env.CERTS_DIR}cert.pem`),
}, app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
  client.on('message', (message) => {
    console.log('received: %s', message);
  });

  io.emit('init-queue', queue);

  client.on('auth', (message) => {
    if (message.name === 'Marc' || message.name === 'Flo') {
      const tmpObj = {
        name: message.name,
        admin: true,
      };
      io.emit('admin', tmpObj);
    } else {
      const tmpObj = {
        name: message.name,
        admin: false,
      };
      io.emit('admin', tmpObj);
    }
  });

  client.on('add', (message) => {
    console.log(message);
    const tmpObj = {
      name: message.name,
      id: queue.length + 1,
    };
    queue.push(tmpObj);
    io.emit('add-user', tmpObj);
    fs.writeFileSync(queuePath, JSON.stringify(queue));
  });

  client.on('remove', (message) => {
    queue = queue.filter((user) => user.id !== message.id);
    fs.writeFileSync(queuePath, JSON.stringify(queue));
    io.emit('init-queue', queue);
  });

  client.on('move', (message) => {
    if (message.dir === 'up') {
      for (let i = 0; i < queue.length; i += 1) {
        const element = queue[i];
        if (message.id === element.id) {
          queue[i].id -= 1;
          queue[i - 1].id += 1;
          break;
        }
      }
    } else if (message.dir === 'down') {
      for (let i = queue.length - 1; i >= 0; i -= 1) {
        const element = queue[i];
        if (message.id === element.id) {
          queue[i].id += 1;
          queue[i + 1].id -= 1;
          break;
        }
      }
    }
    queue = queue.sort((a, b) => a.id - b.id);
    fs.writeFileSync(queuePath, JSON.stringify(queue));
    io.emit('init-queue', queue);
  });

  client.on('message', (message) => {
    console.log('received: %s', message);
  });
});
// start our server
server.listen(3002, () => {
  console.log('Server started on port 3002 :)');
});
