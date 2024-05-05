const express = require('express');
const fs = require('fs');

const app = express();

let urlSaaSApp = "http://0.0.0.0:8080";

// ################################## RATE COUNTER ##################################

// Dict to store the current rps for each IP
let rps = {};

function addRps(ip) {
    if (rps[ip] === undefined) {
        rps[ip] = 1;
    } else {
        rps[ip]++;
    }
}

function getRps(ip) {
    if (rps[ip] === undefined) {
        return 0;
    }
    return rps[ip];
}

function resetAllRps() {
    rps = {};
}

// Reset the rps every 1 second
setInterval(resetAllRps, 1000);

// ################################## RATE LIMITER ##################################

let rpsLimitTable = {};

let totalResources = {
    cpu: 2000,
    memory: 2000
}

function addIP(ip, requestCpu, guaranteedCpu, requestMem, guaranteedMem) {

    let ipInformation = {
        memoryPerRequest: requestMem,
        cpuPerRequest: requestCpu,
        guaranteedMemory: guaranteedMem,
        guaranteedCpu: guaranteedCpu,
        currentLimit: int(min(guaranteedCpu/cpuPerRequest, guaranteedMem/memoryPerRequest)),
        minimumLimit: int(min(guaranteedCpu/cpuPerRequest, guaranteedMem/memoryPerRequest))
    }

    if (rpsLimitTable[ip] === undefined) {
        rpsLimitTable[ip] = ipInformation;
    }

    return true;
}

function removeIP(ip) {
    if (rpsLimitTable[ip] !== undefined) {
        delete rpsLimitTable[ip];
    }

    return true;
}

function checkIP(ip) {
    if (rpsLimitTable[ip] === undefined) {
        return false;
    }

    if (getRps(ip) > rpsLimitTable[ip].currentLimit) {
        return false;
    }

    return true;
}

function getLimit(ip) {
    return rpsLimitTable[ip];
}


// ################################## API ##################################

app.get('/request', (req, res) => {
    addRps(req.ip);

    if (!checkIP(req.ip)) {
        const requestOptions = {
            method: req.method,
            body: req.body,
            headers: req.headers
        };

        fetch(urlSaaSApp, requestOptions)
            .then(response => response.text())
            .then(data => {
                res.send(data);
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('Internal Server Error');
            });
    }
    else {
        res.status(500).send('Rate Limit Exceeded');
    }
});

app.get('/limit/get/:ip', (req, res) => {
    //todo
});

app.get('/limit/set/:ip/:limitCpu/:guaranteedCpu/:limitMem/:guaranteedMem', (req, res) => {
    const ip = req.params.ip;
    const limit = req.params.limit;

    addIP(ip, limit);
    res.send(`IP: ${ip} set to: Limit: ${limit}`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// ################################## LOG ##################################

const filename = `log.csv`;
const content = `method, request, ip\n`;

fs.writeFile(filename, content, (err) => {
    if (err) {
        console.error(err);
    }
});


// Log the request method and URL
app.use((req, res, next) => {
    const filename = `log.csv`;
    const content = `${req.method}, ${req.url}, ${req.ip}\n`;

    fs.writeFile(filename, content, (err) => {
        if (err) {
            console.error(err);
        }
    });

    next();
});