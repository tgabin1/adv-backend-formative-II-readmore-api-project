function errorHandler(error, req, res, next) {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(422).json({ message: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 500 ? 'An unexpected server error occurred.' : error.message;

  res.status(status).json({ message });
}

module.exports = errorHandler;