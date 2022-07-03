import { db } from '../dbStrategy/mongo.js';
import bcrypt from 'bcrypt';
import joi from 'joi';
import { v4 as uuid } from 'uuid';


export async function cadastrarUsuario (req, res) {
    const dadosCadastro = req.body;
  
    const cadastroSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().min(4).max(8).required(), //USA REGEX?
        confirm: joi.string().required().valid(joi.ref('password')) 
      });
    
      const { error } = cadastroSchema.validate(dadosCadastro);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }
  
      const passwordCrypt = bcrypt.hashSync(dadosCadastro.password, 10);
  
      try{
  
        await db
        .collection('clientes')
        .insertOne({ name: dadosCadastro.name, email: dadosCadastro.email, password: passwordCrypt });
        res.status(201).send('Cliente cadastrado com sucesso!');
  
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para cadastrar cliente!');
      }
     
  };
  
export async function loginUsuario (req, res) {
    const dadosLogin = req.body;
  
    const loginSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required() 
      });
    
      const { error } = loginSchema.validate(dadosLogin);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!'); 
      } 
  
      const usuario = await db.collection('clientes').findOne({ email: dadosLogin.email });
      const passwordCrypt = bcrypt.compareSync(dadosLogin.password, usuario.password);
  
      if(usuario && passwordCrypt) {
  
        const token = uuid(); 
        const nome = usuario.name;
  
        await db.collection('sessoes').insertOne({
          token: token,
          userId: usuario._id
        }); 
  
        return res.status(201).send({ token, nome }); 
  
      } else {
        return res.status(401).send('Senha ou email incorretos!'); 
      }
     
  };