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

// ################################## RATE LIMITER ##################################

let rpsLimitTable = {};

let totalResources = {
    cpu: 2000,
    memory: 2000
}

let growthFactor = 2;

function addIP(ip, requestCpu, guaranteedCpu, requestMem, guaranteedMem) {

    let ipInformation = {
        ip: ip,
        memoryPerRequest: requestMem,
        cpuPerRequest: requestCpu,
        guaranteedMemory: guaranteedMem,
        guaranteedCpu: guaranteedCpu,
        currentLimit: Math.floor(Math.min(guaranteedCpu/requestCpu, guaranteedMem/requestMem)),
        minimumLimit: Math.floor(Math.min(guaranteedCpu/requestCpu, guaranteedMem/requestMem)),
        growth: 0 // 0 means no growth, 1 means grow, -1 means shrink
    }

    if (rpsLimitTable[ip] === undefined) {
        rpsLimitTable[ip] = ipInformation;
    }

    return ipInformation;
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

function updateLimits() {
    // Calculate the amount of "bonus" resources
    let bonusCpu = totalResources.cpu;
    let bonusMemory = totalResources.memory;

    for (let ip in rpsLimitTable) {
        bonusCpu -= rpsLimitTable[ip].minimumLimit * rpsLimitTable[ip].cpuPerRequest;
        bonusMemory -= rpsLimitTable[ip].minimumLimit * rpsLimitTable[ip].memoryPerRequest;
    }

    // Metrics
    numberGrow = 0;
    numberShrink = 0;
    growCpu = 0;
    growMemory = 0;

    // Go through processes, and check if they need to grow or shrink
    for (let ip in rpsLimitTable) {
        let ipInformation = rpsLimitTable[ip];

        // If the rps is between 40% and 75%, do nothing
        if (0.4 * ipInformation.currentLimit <= getRps(ip) <= 0.75 * ipInformation.currentLimit) {
            ipInformation.growth = 0;
            rpsLimitTable[ip] = ipInformation;
        }

        // If the rps is higher than 75% of the current limit, grow
        if (getRps(ip) > 0.75 * ipInformation.currentLimit) {
            ipInformation.growth = 1;

            numberGrow++;
            growCpu += ipInformation.cpuPerRequest;
            growMemory += ipInformation.memoryPerRequest;

            rpsLimitTable[ip] = ipInformation;
            continue;
        } 

        // If the current limit is the minimum limit, do nothing
        if (ipInformation.currentLimit === ipInformation.minimumLimit) {
            ipInformation.growth = 0;

            rpsLimitTable[ip] = ipInformation;
            continue;
        }

        // If the rps is lower than 40% of the current limit, shrink
        if (getRps(ip) < 0.4 * ipInformation.currentLimit) {
            ipInformation.growth = -1;

            numberShrink++;
            growCpu -= ipInformation.cpuPerRequest;
            growMemory -= ipInformation.memoryPerRequest;

            rpsLimitTable[ip] = ipInformation;
            continue;
        }
    }

    // Go through processes, and grow/shrink respecting following constraints:
    // a. When growing, each process increases limit by growthFactor
    // b. When shrinking, each process decreases limit by growthFactor
    // 1. If there is room for each process to grow, grow them all
    // 2. If there is no room for each process to grow, distribute the bonus resources 
    //   equally to all processes

    growCpu *= growthFactor;
    growMemory *= growthFactor;

    // 1
    if (bonusCpu >= growCpu && bonusMemory >= growMemory) {
        for (let ip in rpsLimitTable) {
            let ipInformation = rpsLimitTable[ip];
            if (ipInformation.growth === 1) {
                ipInformation.currentLimit += growthFactor;
            } else if (ipInformation.growth === -1) {
                ipInformation.currentLimit -= growthFactor;
            }
            rpsLimitTable[ip] = ipInformation; 
        }

        return;
    }

    // 2
    // calculate how many resources each process gets
    let numberOfProcesses = Object.keys(rpsLimitTable).length;
    let cpuPerProcess = bonusCpu / numberOfProcesses;
    let memoryPerProcess = bonusMemory / numberOfProcesses;

    // Metrics
    let remainingCPU = totalResources.cpu;
    let remainingMemory = totalResources.memory;

    // Distribute the resources
    for (let ip in rpsLimitTable) {
        let ipInformation = rpsLimitTable[ip];
        ipInformation.currentLimit += Math.floor(Math.min(cpuPerProcess / ipInformation.cpuPerRequest, memoryPerProcess / ipInformation.memoryPerRequest));
        rpsLimitTable[ip] = ipInformation;

        remainingCPU -= ipInformation.currentLimit * ipInformation.cpuPerRequest;
        remainingMemory -= ipInformation.currentLimit * ipInformation.memoryPerRequest;
    }

    // Distribute remaining resources in round robin
    while (true){
        let distributed = false;

        for (let ip in rpsLimitTable) {
            let ipInformation = rpsLimitTable[ip];

            if (remainingCPU >= ipInformation.cpuPerRequest && remainingMemory >= ipInformation.memoryPerRequest) {
                ipInformation.currentLimit++;
                rpsLimitTable[ip] = ipInformation;

                remainingCPU -= ipInformation.cpuPerRequest;
                remainingMemory -= ipInformation.memoryPerRequest;

                distributed = true;
            }
        }

        if (!distributed) {
            break;
        }
    }
}

// Update everything every 1 second
function update() {
    updateLimits();
    resetAllRps();
}

setInterval(update, 1000);

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
    let ipInformation = getLimit(req.params.ip);

    if (ipInformation === undefined) {
        res.status(404).send('IP not found');
        return;
    }
    
    res.send(`
        <html>
            <head>
                <title>IP Information</title>
            </head>
            <body>
                <h1>IP Information</h1>
                <p>IP: ${ipInformation.ip} is set to:</p>
                <ul>
                    <li>requestCPU: ${ipInformation.cpuPerRequest}</li>
                    <li>guaranteedCPU: ${ipInformation.guaranteedCpu}</li>
                    <li>requestMem: ${ipInformation.memoryPerRequest}</li>
                    <li>guaranteedMem: ${ipInformation.guaranteedMemory}</li>
                </ul>
            </body>
        </html>
    `);
});

// Set the limits for an IP
app.get('/limit/set/:ip/:limitCpu/:guaranteedCpu/:limitMem/:guaranteedMem', (req, res) => {
    const ip = req.params.ip;
    const limitCpu = req.params.limitCpu;
    const guaranteedCpu = req.params.guaranteedCpu;
    const limitMem = req.params.limitMem;
    const guaranteedMem = req.params.guaranteedMem;

    if (isNaN(limitCpu) || isNaN(guaranteedCpu) || isNaN(limitMem) || isNaN(guaranteedMem)) {
        res.status(400).send('Invalid input');
        return;
    }

    let ipInformation = addIP(ip, limitCpu, guaranteedCpu, limitMem, guaranteedMem);

    res.send(`
        <html>
            <head>
                <title>IP Information</title>
            </head>
            <body>
                <h1>IP Information</h1>
                <p>IP: ${ip} set to:</p>
                <ul>
                    <li>requestCPU: ${ipInformation.cpuPerRequest}</li>
                    <li>guaranteedCPU: ${ipInformation.guaranteedCpu}</li>
                    <li>requestMem: ${ipInformation.memoryPerRequest}</li>
                    <li>guaranteedMem: ${ipInformation.guaranteedMemory}</li>
                </ul>
            </body>
        </html>
    `);
});

app.get('/set_saas_url/:url', (req, res) => {
    urlSaaSApp = req.params.url;
    res.send(`URL set to: ${urlSaaSApp}`);
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