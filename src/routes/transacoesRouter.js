import { enviarTransacao, retornarTransacoes } from '../controllers/transacoesController.js';
import { Router } from 'express';

const router = Router();

router.post('/transacoes', enviarTransacao);
router.get('/transacoes', retornarTransacoes);

export default router;