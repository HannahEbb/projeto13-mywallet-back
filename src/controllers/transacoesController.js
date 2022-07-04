import { db, ObjectId } from '../dbStrategy/mongo.js';
import joi from 'joi';
import dayjs from 'dayjs';


export async function enviarTransacao (req, res) {
   
    const sessao = res.locals.sessao;
  
    const dadosTransacao = req.body;
  
      const transacaoSchema = joi.object({
          entry: joi.number().required(),
          description: joi.string().required(),
          type: joi.string().allow('entrada', 'saida').required() 
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
       
  };
  
export async function retornarTransacoes (req, res) {
  
    const sessao = res.locals.sessao;
  
        try {
  
          const transacoes = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId)}).toArray();
          console.log(transacoes);
  
          const depositos = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId), type: "entrada" }).toArray();
          const gastos = await db.collection('transacoes').find({ userId: new ObjectId(sessao.userId), type: "saida" }).toArray();
          
          function somarTransacoes (array) {
            let sum = 0; 
            array.forEach(item => {
              sum += parseFloat(item.entry);
            });
            return sum;
          }
  
          const saldo = somarTransacoes(depositos) - somarTransacoes(gastos);
  
          res.status(201).send({transacoes, saldo}); 
  
        } catch(error) {
              console.error({ error });
              res.status(500).send('Problema para retornar transacoes!');
        }
       
  };