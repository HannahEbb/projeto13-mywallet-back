import express from 'express';
import joi from 'joi';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

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
     
});


app.post('/login', async (req, res) => {
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

        const token = uuid(); // cria o token 
        const nome = usuario.name;

        await db.collection('sessoes').insertOne({
          token: token,
          userId: usuario._id
        }); // salva o token na colecao de sessoes para poder comparar depois que o usuario fizer reqs.

        return res.status(201).send({ token, nome }); // manda o TOKEN para o front!

      } else {
        return res.status(401).send('Senha ou email incorretos!'); //usuario nao encontrado
      }
     
});


app.post('/transacoes', async (req, res) => {
  const { authorization } = req.headers; //pega o TOKEN  

  const token = authorization?.replace('Bearer ', ''); // Tira a parte em texto que vem junto com a req do front

  const sessao = await db.collection('sessoes').findOne({ token }); // Encontra a sessao do usuario com base no token recebido

  if(!sessao) {
    return res.sendStatus(401);
  }

  const dadosTransacao = req.body;

    const transacaoSchema = joi.object({
        entry: joi.number().required(),
        description: joi.string().required(),
        type: joi.string().allow('entrada', 'saida').required() // ADD que so pode entrada ou saida.
      });
    
      const { error } = transacaoSchema.validate(dadosTransacao);
    
      if (error) {
        return res.status(422).send('Preencha os campos corretamente, por favor!');
      }

      try {

        await db.collection('transacoes').insertOne({ entry: dadosTransacao.entry, description: dadosTransacao.description, type: dadosTransacao.type, date: dayjs().format('DD/MM'), userId: sessao.userId });
        
        res.status(201).send('Nova transacao registrada com sucesso!'); 

      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para resgistrar transacao!');
      }
     
});


app.get('/transacoes', async (req, res) => {
  const { authorization } = req.headers; //pega o TOKEN  

  const token = authorization?.replace('Bearer ', ''); // Tira a parte em texto que vem junto com a req do front

  const sessao = await db.collection('sessoes').findOne({ token }); // Encontra a sessao do usuario com base no token recebido

  if(!sessao) {
    return res.sendStatus(401);
  }

      try {

        const transacoes = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId)}).toArray();
        console.log(transacoes);

        const depositos = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId), type: "entrada" }).toArray();
        const gastos = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId), type: "saida" }).toArray();
        
        function somarTransacoes (array) {
          let sum = 0; 
          array.forEach(item => {
            sum += parseInt(item.entry);
          });
          return sum;
        }

        const saldo = somarTransacoes(depositos) - somarTransacoes(gastos);

        res.status(201).send({transacoes, saldo}); 

      } catch(error) {
            console.error({ error });
            res.status(500).send('Problema para retornar transacoes!');
      }
     
});


app.listen(process.env.PORT, () => console.log('Servidor rodando!'));