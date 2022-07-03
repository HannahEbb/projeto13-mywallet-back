import { MongoClient, ObjectId } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.URL_CONNECT_MONGO);
const promise = mongoClient.connect().then(() => {
  db = mongoClient.db(process.env.MONGO_DATABASE_NAME);
});


export { db, ObjectId }