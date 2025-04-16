import express, { Request, Response } from 'express';
import router from './routes';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api', router);

// Standard listend call for express
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});