import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { env } from './config/env';

import routes from './routes';

const app: Express = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api', routes);

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Survivor League API' });
});

// Iniciar servidor
app.listen(env.server.port || 8000, () => {
  console.log(`Server is running on port ${env.server.port}`);
}); 