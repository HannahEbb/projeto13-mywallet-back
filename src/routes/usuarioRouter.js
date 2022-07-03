import { cadastrarUsuario, loginUsuario } from '../controllers/usuarioController.js';
import { Router } from 'express';

const router = Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);

export default router;