import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

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
        email: joi.string().required(),
        password: joi.string().email().required() //USA REGEX?
        //COLOCA O TOKEN TAMBEM?
      });
    
      const { error } = cadastroSchema.validate(dadosCadastro);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }

      try{
        await db
        .collection('clientes')
        .insertOne({ name: dadosCadastro.name, email: dadosCadastro.email, password: dadosCadastro.password, confirm: dadosCadastro.confirm });
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
    
      const { error } = cadastroSchema.validate(dadosLogin);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }

      try{
        await db
        .collection('clientes')
        .findOne({ email: dadosLogin.email, password: dadosLogin.password });
        //vai condição de ter o token aqui? -> token: token??
        res.status(201).send('Dados corretos'); //o que tem que mandar para o login ser aceito no front?
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para fazer login!');
      }
     
});


app.post('/entrada', async (req, res) => {
    const dadosEntrada = req.body;
    //o TOKEN vem no body tambem??

    const entradaSchema = joi.object({
        entry: joi.number().required(),
        description: joi.string().required()
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

        await db.collection('entradas').insertOne({ token: dadosEntrada.token, entry: dadosEntrada.entry, description: dadosEntrada.description });
        
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

        await db.collection('saidas').insertOne({ token: dadosEntrada.token, spent: dadosSaida.spent, description: dadosSaida.description });
        
        res.status(201).send('Nova saída registrada!'); 
      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para resgistrar saída!');
      }
     
})