class ResJson {
    constructor(result = false, msg = "UNKNOWN ERROR!!", data) {
        this.result = result;
        this.msg = msg;
        this.data = data;
    }
}

const normalizePort = (portStr) => {
    const port = parseInt(portStr, 10);

    if (isNaN(port)) {
        return portStr;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

export {ResJson, normalizePort}