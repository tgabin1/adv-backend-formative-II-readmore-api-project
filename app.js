const express = require('express');
const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'ReadMore API is running.' });
});

app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;