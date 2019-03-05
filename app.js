const express = require('express');
const path = require('path');
const http = require('http');
const socket = require("socket.io");

const fs = require('fs');

const FileTailReader = require('./fileTailReader');

let app = express();
app.use(express.static(path.join(__dirname, 'public')));

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


const server = http.createServer(app);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html', {title: 'Express'});
});

app.get('/directory', (req, res) => {
    const directory = req.query.directory;
    console.log(directory);

    if (fs.existsSync(directory) === false) {
        throw new Error("File Does not exists");
    }

    const dirStat = fs.statSync(directory);
    if (dirStat.isDirectory() === false) {
        console.log("test");
    }

    return res.json({"test": "testse"});
});

server.listen(port, () => {
    console.log(`File monitor app intialized on port ${port} `);
});

function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

const sio = socket(server);
let socketUsers = [];

sio.on('connection', (socket) => {
    console.log("Connection established with socket id : " + socket.id);

    socket.on('disconnect', function () {
        console.log('user disconnected of id ' + socket.id);
    });

    socket.on('viewlogs', function (data) {

        socketUsers[socket.id] = [];
        socketUsers[socket.id]['filenamePath'] = data.filename;

        let ft = new FileTailReader(sio, socket, socketUsers);

    });


});
