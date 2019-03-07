import express from 'express';
import path from 'path';
import http from 'http';
import socket from 'socket.io';
import fs from 'fs';
import FileTailReader from './fileTailReader';

let app = express();
app.use('/static', express.static(path.join(__dirname, 'public')));

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


const server = http.createServer(app);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html', {title: 'Express'});
});

app.get('/axios', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'axios', 'dist', 'axios.js'), {title: 'Express'});
});

app.get('/directory', (req, res) => {
    const directory = req.query.dir;
    if (directory === undefined || directory === "") {
        res.status(400);
        return res.json(
            {
                result: false,
                msg: 'Required Directory!!'
            }
        );
    }

    const dirStat = fs.statSync(directory);
    if (dirStat.isDirectory() === false) {
        res.status(400);
        return res.json(
            {
                result: false,
                msg: 'Not Valid Directory!!'
            }
        );
    }

    const readFileList = fs.readdirSync(directory);

    return res.json(
        {
            result: true,
            msg: 'SUCCESS',
            data: readFileList
        }
    );
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

    socket.on('disconnect', () => {
        console.log('user disconnected of id ' + socket.id);
    });

    socket.on('viewlogs', (data) => {

        socketUsers[socket.id] = [];
        socketUsers[socket.id]['filenamePath'] = path.join(data.directory, data.filename);

        new FileTailReader(sio, socket, socketUsers);

    });


});
