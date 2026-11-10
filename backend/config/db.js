const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mongodProc = null;

async function launchLocalMongod() {
  const dataDir = path.join(__dirname, '..', 'data', 'db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return new Promise((resolve) => {
    try {
      console.log(`[Database] Attempting to spawn local mongod on dbpath: ${dataDir}`);
      mongodProc = spawn('mongod', ['--dbpath', dataDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
        detached: true,
        stdio: 'ignore'
      });
      mongodProc.unref();
      setTimeout(() => resolve(true), 3000);
    } catch (err) {
      console.warn('[Database] Could not spawn local mongod:', err.message);
      resolve(false);
    }
  });
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kadaivoice';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  } catch (err) {
    console.log(`[Database] Initial connect failed (${err.message}). Trying to start local mongod...`);
  }

  // Attempt spawning local mongod
  const started = await launchLocalMongod();
  if (started) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Successfully connected to freshly spawned mongod instance!`);
      return;
    } catch (spawnErr) {
      console.error('[Database] Failed to connect after launching mongod:', spawnErr.message);
    }
  }

  throw new Error('Could not establish MongoDB connection.');
};

module.exports = connectDB;
