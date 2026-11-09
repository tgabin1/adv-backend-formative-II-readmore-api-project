const Author = require('../models/Author');
const Book = require('../models/Book');
const { isValidId } = require('../utils/validators');

async function createAuthor(req, res) {
  const author = await Author.create({
    name: req.body.name,
    country: req.body.country,
    bio: req.body.bio
  });

  res.status(201).json(author);
}

async function getAuthors(req, res) {
  const authors = await Author.find().sort({ name: 1 });
  res.status(200).json(authors);
}

async function getAuthorById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Author id must be a valid MongoDB id.' });
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'Author was not found.' });
  }

  res.status(200).json(author);
}

async function updateAuthor(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Author id must be a valid MongoDB id.' });
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'Author was not found.' });
  }

  for (const field of ['name', 'country', 'bio']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      author[field] = req.body[field];
    }
  }

  await author.save();
  res.status(200).json(author);
}

async function deleteAuthor(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Author id must be a valid MongoDB id.' });
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'Author was not found.' });
  }

  const bookCount = await Book.countDocuments({ author: author._id });
  if (bookCount > 0) {
    return res.status(409).json({
      message: 'This author still has books. Move or delete the books before deleting the author.',
      bookCount
    });
  }

  await author.deleteOne();
  res.status(200).json({ message: 'Author deleted.' });
}

async function getAuthorBooks(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Author id must be a valid MongoDB id.' });
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'Author was not found.' });
  }

  const books = await Book.find({ author: author._id })
    .populate('author', 'name country bio')
    .sort({ title: 1 });

  res.status(200).json(books);
}

async function getAuthorStats(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Author id must be a valid MongoDB id.' });
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'Author was not found.' });
  }

  const books = await Book.find({ author: author._id }).sort({ price: 1 });
  const totalPrice = books.reduce((sum, book) => sum + book.price, 0);

  res.status(200).json({
    author: author.name,
    bookCount: books.length,
    averagePrice: books.length === 0 ? 0 : Number((totalPrice / books.length).toFixed(2)),
    cheapestBook: books.length === 0 ? null : books[0].title,
    mostExpensiveBook: books.length === 0 ? null : books[books.length - 1].title
  });
}

module.exports = {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
  getAuthorStats
};