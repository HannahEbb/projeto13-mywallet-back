import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usuarioRouter from './routes/usuarioRouter.js';
import transacoesRouter from './routes/transacoesRouter.js';
import { validarUsuario } from './middlewares/validarUsuario.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use(usuarioRouter);
app.use(validarUsuario, transacoesRouter);

app.listen(process.env.PORT, () => console.log('Servidor rodando!'));