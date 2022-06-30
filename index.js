import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.URL_CONNECT_MONGO);
const promise = mongoClient.connect().then(() => {
  db = mongoClient.db(process.env.MONGO_DATABASE_NAME);
});

promise.catch(err => {
  console.log('Deu pau ao conectar o banco de dados!!!!');
});



//TIPOS DE ERRO: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status 

app.post('/cadastro', async (req, res) => {
    const dadosCadastro = req.body;

    const cadastroSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required(), //USA REGEX?
        confirm: joi.string().required() // verifica antes de criptografar
        //COLOCA O TOKEN TAMBEM?
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
        //insere o TOKEN aqui??
        res.status(201).send('Cliente cadastrado com sucesso!');//ENVIA PARA O FRONT UM OBJETO COM O TOKEN ao inves da mensagem!! 
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para cadastrar cliente!');
      }
     
});


app.post('/login', async (req, res) => {
    const dadosLogin = req.body;

    const loginSchema = joi.object({
        email: joi.string().required(),
        password: joi.string().email().required() //USA REGEX?
        //COLOCA O TOKEN TAMBEM?
      });
    
      const { error } = loginSchema.validate(dadosLogin);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!'); //erro do validate joi
      } 

      const usuario = await db.collection('clientes').findOne({ email: dadosLogin.email });

      if(!usuario) {
        return res.sendStatus(404); //usuario nao encontrado
      }

      const passwordCrypt = bcrypt.compareSync(dadosLogin.password, usuario.password);

      if(!passwordCrypt) {
        return res.status(401).send('Senha ou e-mail incorretos'); //usuario nao autorizado!
      }

     res.status(201).send('Usuário logado com sucesso!'); // manda info para o front entender que deu certo!
     
});


app.post('/entrada', async (req, res) => {
    const dadosEntrada = req.body;
    //o TOKEN vem no body tambem??

    const entradaSchema = joi.object({
        entry: joi.number().required(),
        description: joi.string().required(),
        //COLOCA O TOKEN PARA IDENTIFICAR CLIENTE
      });
    
      const { error } = entradaSchema.validate(dadosEntrada);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }

      try{
        clienteExiste = await db.collection('clientes').findOne({ token: dadosEntrada.token });

        if (clienteExiste) {
            return res.sendStatus(409);
          }

        await db.collection('entradas').insertOne({ token: dadosEntrada.token, entry: dadosEntrada.entry, description: dadosEntrada.description, date: dayjs().format('DD/MM/YYYY') });
        
        res.status(201).send('Nova entrada registrada!'); 
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para resgistrar entrada!');
      }
     
});


app.post('/saida', async (req, res) => {
    const dadosSaida = req.body;
    //o TOKEN vem no body tambem??

    const saidaSchema = joi.object({
        spent: joi.number().required(),
        description: joi.string().required()
        //COLOCA O TOKEN PARA IDENTIFICAR CLIENTE
      });
    
      const { error } = saidaSchema.validate(dadosSaida);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }

      try{
        clienteExiste = await db.collection('clientes').findOne({ token: dadosSaida.token });

        if (clienteExiste) {
            return res.sendStatus(409);
          }

        await db.collection('saidas').insertOne({ token: dadosEntrada.token, spent: dadosSaida.spent, description: dadosSaida.description, date: dayjs().format('DD/MM/YYYY') });
        
        res.status(201).send('Nova saída registrada!'); 
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para resgistrar saída!');
      }
     
})


app.listen(process.env.PORT, () => console.log('Servidor rodando!'));