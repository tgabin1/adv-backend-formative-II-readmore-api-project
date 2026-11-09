require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  app.listen(PORT, () => {
    console.log('ReadMore API is running at http://localhost:' + PORT);
  });
}

startServer().catch((error) => {
  console.error('Could not start the server:', error.message);
  process.exit(1);
});