import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cadastrarUsuario, loginUsuario } from './controllers/usuarioController.js';
import { enviarTransacao, retornarTransacoes } from './controllers/transacoesController.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


app.post('/cadastro', cadastrarUsuario);

app.post('/login', loginUsuario);

app.post('/transacoes', enviarTransacao);

app.get('/transacoes', retornarTransacoes);


app.listen(process.env.PORT, () => console.log('Servidor rodando!'));