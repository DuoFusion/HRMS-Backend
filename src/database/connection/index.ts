require('dotenv').config()
import mongoose from 'mongoose';
import express from 'express'
import { config } from '../../../config';
const dbUrl: any = config.DB_URL;
const mongooseConnection = express()
mongoose.set('strictQuery', false)
mongoose.connect(
    dbUrl, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      connectTimeoutMS: 30000
    }
).then(() => console.log('Database successfully connected')).catch(err => console.log(err));

mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err)
  })
  
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

export { mongooseConnection }