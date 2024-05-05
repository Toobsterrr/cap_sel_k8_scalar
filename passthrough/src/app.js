const express = require('express');
const fs = require('fs');

const app = express();

app.use((req, res, next) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}.txt`;
    const content = `${req.method} ${req.url}`;

    fs.writeFile(filename, content, (err) => {
        if (err) {
            console.error(err);
        }
    });

    next();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
