// const express = require('express');
// const http = require('http');

// const app = express();
// const router = express.Router();

// router.use((req, res, next) => {
//   res.header('Access-Control-Allow-Methods', 'GET');
//   next();
// });

// router.get('/health', (req, res) => {
//   res.status(200).send('Ok');
// });

// app.use('/api/v1', router);

// const server = http.createServer(app);
// server.listen(3000);


import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.get('/health', (req, res) => {
    const data = {
        uptime: app.uptime(),
        message: 'Ok',
        date: new Date()
    }
    res.status(200).send(data);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});