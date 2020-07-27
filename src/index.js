const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();
app.use(cors);

let queue = JSON.parse(fs.readFileSync('./res/queue.json'));

// initialize a simple http server
const server = https.createServer({
  key: fs.readFileSync('./privkey.pem'),
  cert: fs.readFileSync('./cert.pem'),
}, app);
const io = require('socket.io')(server);

io.on('connection', (client) => {
  client.on('message', (message) => {
    console.log('received: %s', message);
  });

  io.emit('init-queue', queue);

  client.on('auth', (message) => {
    if (message.name === 'Marc' || 'Flo') {
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
    fs.writeFileSync('./res/queue.json', JSON.stringify(queue));
  });

  client.on('remove', (message) => {
    queue = queue.filter((user) => user.id !== message.id);
    fs.writeFileSync('./res/queue.json', JSON.stringify(queue));
    io.emit('init-queue', queue);
  });

  client.on('move', (message) => {
    if (message.dir === 'up') {
      queue.forEach((element, i) => {
        if (message.id === element.id) {
          queue[i].id -= 1;
        }
      });
      queue.forEach((element, i) => {
        if (message.id - 1 === element.id) {
          queue[i].id += 1;
        }
      });
    } else if (message.dir === 'down') {
      queue.forEach((element, i) => {
        if (message.id === element.id) {
          queue[i].id += 1;
        }
      });
      queue.forEach((element, i) => {
        if (message.id + 1 === element.id) {
          queue[i].id -= 1;
        }
      });
    }

    fs.writeFileSync('./res/queue.json', JSON.stringify(queue));
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
