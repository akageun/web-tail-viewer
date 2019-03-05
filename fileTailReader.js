const fs = require('fs');
const rf = require('readline');

module.exports = class FileTailReader {
    constructor(sio, socket, socketUsers) {

        const logFilename = socketUsers[socket.id]['filenamePath']

        this._init(sio, socket, socketUsers, logFilename);
        this.fileRead(sio, socket, socketUsers, logFilename);
    }

    async _init(sio, socket, socketUsers, logFilename) {

        this._isValid(logFilename);

        const stat = fs.statSync(logFilename);

        await this._preFileRead(sio, socket, socketUsers, stat, logFilename);

        const lastSize = await this._getLastSizeTemp(stat);
        socketUsers[socket.id]['location'] = lastSize;
    }

    _isValid(logFilename) {
        if (fs.existsSync(logFilename) === false) {
            throw new Error("File Does not exists");
        }
    }

    _preFileRead(sio, socket, socketUsers, stat, logFilename) {
        return new Promise((resolve, reject) => {

            let calculateStartSize = 0;

            if (stat.size > 1000000) {
                calculateStartSize = stat.size - 1000000;
            }

            const inputStream = fs.createReadStream(logFilename, {start: calculateStartSize});
            const rl = rf.createInterface({
                input: inputStream,
                crlfDelay: Infinity
            });

            if (socketUsers.indexOf(socket.id) === -1) {

                rl.on('line', (line) => {

                    let lineData;

                    sio.to(`${socket.id}`).emit('streamingdata', line);
                    lineData = line;

                    if (lineData === undefined || lineData === "") {
                        reject("Failed to read the file");

                    } else {
                        resolve([socketUsers, socket]);

                    }

                });
            }
        });
    }

    _getLastSizeTemp(stat) {
        let currFileLastSize = stat.size;

        if (currFileLastSize === 0) {
            throw new Error("Failed to read the file");
        } else {
            return currFileLastSize;
        }
    }

    fileRead(sio, socket, socketUsers, logFilename) {
        fs.watchFile(logFilename, {interval: 1000}, (event) => {

            const stat = fs.statSync(logFilename);

            let oldSize = socketUsers[socket.id]['location'];

            const fsReadStream = fs.createReadStream(logFilename, {start: oldSize, end: stat.size});

            const rl = rf.createInterface({
                input: fsReadStream,
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                sio.to(`${socket.id}`).emit('streamingdata', line);
            });

            oldSize = stat.size;
            socketUsers[socket.id]['location'] = oldSize;
        });

    }
};