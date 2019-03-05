const fs = require('fs');
const rf = require('readline');

module.exports = class FileTailReader {
    constructor(sio, socket, socketUsers) {

        this._init(sio, socket, socketUsers);
        this.fileRead(sio, socket, socketUsers);
    }

    async _init(sio, socket, socketUsers) {

        const logFilename = socketUsers[socket.id]['filenamePath']

        this._isValid(logFilename);

        const stat = fs.statSync(logFilename);

        await this._preFileRead(sio, socket, socketUsers, stat);

        const lastSize = await this._getLastSizeTemp(stat);
        socketUsers[socket.id]['location'] = lastSize;
    }

    _isValid(logFilename) {
        if (fs.existsSync(logFilename) === false) {
            throw new Error("File Does not exists");
        }
    }

    _preFileRead(sio, socket, socketUsers, stat) {
        return new Promise((resolve, reject) => {

            const logFilename = socketUsers[socket.id]['filenamePath'];

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

                //emit file data  line by line
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

    fileRead(sio, socket, socketUsers) {

        /**
         * [shouldWait boolean to handle the issue of node file descriptor twice event trigger]
         * @type {Boolean}
         */
        let shouldWait = false;

        /**
         * [logFilename Name of the file to read]
         * @type {[type]}
         */
        const logFilename = socketUsers[socket.id]['filenamePath'];

        //This function will start watching file for any updates
        fs.watchFile(logFilename, {interval: 1000}, (event) => {

            const stat = fs.statSync(logFilename);


            let oldsize = socketUsers[socket.id]['location'];

            //get the file data from start and end position specified.
            const fsread = fs.createReadStream(logFilename, {start: oldsize, end: stat.size});

            const fileReadLine = rf.createInterface({
                input: fsread,
                crlfDelay: Infinity
            });

            fileReadLine.on('line', (line) => {

                sio.to(`${socket.id}`).emit('streamingdata', line);
            });

            oldsize = stat.size;
            socketUsers[socket.id]['location'] = oldsize;
        });

    }
};