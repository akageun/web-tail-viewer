let insertType = '';
let cio;

window.onload = function () {
    insertType = document.querySelector('input[name="insertType"]:checked').value; //init

    this.initWs();
};

function initWs() {
    cio = io();

    cio.on('disconnect', function () {
        cio.disconnect();
    });

    cio.on('streamingdata', function (msg) {
        let el = document.getElementById('logId');
        insertLog(el, insertType, msg);
    });
}

function insertLog(el, insertType, logText) {
    let elChild = document.createElement('li');
    elChild.innerHTML = logText;


    if (insertType === 'append') {
        el.appendChild(elChild);

    } else { //prepend
        el.insertBefore(elChild, el.firstChild);

    }
}

function getFileList() {
    let directory = document.getElementById('directory').value;

    if (directory === undefined || directory === "") {
        alert("Required Directory!");
        return;
    }

    axios.get('/directory', {params: {dir: directory}}).then(function (res) {

        if (res.status !== 200 || res.data.result === false) {
            alert(res.data.msg);
            return;
        }

        let select = document.getElementById("targetDir");
        for (let t in res.data.data) {
            let fileName = res.data.data[t];

            let option = document.createElement("option");
            option.text = fileName;
            option.value = fileName;

            select.appendChild(option);
        }
    });
}

function view() {
    let directory = document.getElementById('directory').value;
    let filename = document.getElementById("targetDir").value;

    insertType = document.querySelector('input[name="insertType"]:checked').value; //init
    document.getElementById('logId').innerHTML = '';

    cio.emit('viewlogs', {directory: directory, filename: filename});
}

function fontSize(type) {
    let el = document.getElementById('logId');
    let style = window.getComputedStyle(el, null).getPropertyValue('font-size');
    let fontSize = parseFloat(style);

    if (type === 'down') {
        if (fontSize === 10) {
            alert('Min font-size 10!');
            return;
        }

        fontSize -= 1

    } else if (type === 'up') {
        if (fontSize >= 18) {
            alert('Max font-size 18!');
            return;
        }

        fontSize += 1
    } else {
        alert("not support!!");
        return;
    }

    el.style.fontSize = fontSize + 'px';
}
