const express = require('express');
const app = express();
const multer = require('multer');
const compiler = require('./compiler');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, '/tmp/');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single('myfile');

async function deploy(contractFile, res) {
    const returnValue = await compiler.deploy(contractFile);
    res.end(returnValue);
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/upload.html");
});

app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Error uploading file.");
        }

        const contractFile = compiler.compile(req.file.path);

        if(typeof contractFile === "string") {
            res.end(contractFile);
        } else {
            deploy(contractFile, res);
        }
    });
});

app.listen('3000', () => {
    console.log('Listen Successfully on 3000');
})