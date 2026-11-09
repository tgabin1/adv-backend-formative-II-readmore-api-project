const Author = require('../models/Author');
const Book = require('../models/Book');
const {
  isValidId,
  validateBookRules,
  findDuplicateTitle
} = require('../utils/validators');

function populateAuthor(query) {
  return query.populate('author', 'name country bio');
}

function validatePaginationValue(value, fallback, name, maximum) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  const isInvalid = !Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum);
  if (isInvalid) {
    const range = maximum ? 'from 1 to ' + maximum : 'a whole number greater than or equal to 1';
    throw Object.assign(new Error(name + ' must be ' + range + '.'), { status: 400 });
  }

  return parsed;
}

async function createBook(req, res) {
  const { title, genre, price, publishedYear, author: authorId } = req.body;

  const ruleError = validateBookRules(req.body);
  if (ruleError) {
    return res.status(422).json({ message: ruleError });
  }

  if (!authorId || !isValidId(authorId)) {
    return res.status(400).json({ message: 'Provide a valid id for an existing author.' });
  }

  const authorExists = await Author.exists({ _id: authorId });
  if (!authorExists) {
    return res.status(400).json({ message: 'The specified author does not exist.' });
  }

  const candidateTitle = typeof title === 'string' ? title : '';
  const duplicate = await findDuplicateTitle(candidateTitle, authorId);
  if (duplicate) {
    return res.status(409).json({ message: 'This author already has a book with that title.' });
  }

  const book = await Book.create({ title, genre, price, publishedYear, author: authorId });
  await book.populate('author', 'name country bio');
  res.status(201).json(book);
}

async function getBooks(req, res) {
  const filter = {};

  if (req.query.genre !== undefined) {
    filter.genre = String(req.query.genre).trim();
  }

  if (req.query.author !== undefined) {
    if (!isValidId(String(req.query.author))) {
      return res.status(400).json({ message: 'author must be a valid MongoDB id.' });
    }
    filter.author = req.query.author;
  }

  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    filter.price = {};

    if (req.query.minPrice !== undefined) {
      const minimum = Number(req.query.minPrice);
      if (!Number.isFinite(minimum)) {
        return res.status(400).json({ message: 'minPrice must be a number.' });
      }
      filter.price.$gte = minimum;
    }

    if (req.query.maxPrice !== undefined) {
      const maximum = Number(req.query.maxPrice);
      if (!Number.isFinite(maximum)) {
        return res.status(400).json({ message: 'maxPrice must be a number.' });
      }
      filter.price.$lte = maximum;
    }

    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      return res.status(400).json({ message: 'minPrice cannot be greater than maxPrice.' });
    }
  }

  if (req.query.search !== undefined && String(req.query.search).trim() !== '') {
    const escapedSearch = String(req.query.search).trim().split('').map((character) => {
      return '.^$*+?()[]{}|\\'.includes(character) ? '\\' + character : character;
    }).join('');
    filter.title = { $regex: escapedSearch, $options: 'i' };
  }

  const allowedSortFields = ['price', 'title', 'publishedYear'];
  const sortField = req.query.sort === undefined ? null : String(req.query.sort);
  if (sortField && !allowedSortFields.includes(sortField)) {
    return res.status(400).json({ message: 'sort must be price, title, or publishedYear.' });
  }

  const order = req.query.order === undefined ? 'asc' : String(req.query.order).toLowerCase();
  if (!['asc', 'desc'].includes(order)) {
    return res.status(400).json({ message: 'order must be asc or desc.' });
  }

  const page = validatePaginationValue(req.query.page, 1, 'page');
  const limit = validatePaginationValue(req.query.limit, 10, 'limit', 100);
  const sort = sortField ? { [sortField]: order === 'asc' ? 1 : -1 } : { title: 1 };
  const skip = (page - 1) * limit;

  const [total, results] = await Promise.all([
    Book.countDocuments(filter),
    populateAuthor(Book.find(filter)).sort(sort).skip(skip).limit(limit)
  ]);

  res.status(200).json({ page, limit, total, results });
}

async function getBookById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Book id must be a valid MongoDB id.' });
  }

  const book = await populateAuthor(Book.findById(req.params.id));
  if (!book) {
    return res.status(404).json({ message: 'Book was not found.' });
  }

  res.status(200).json(book);
}

async function updateBook(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Book id must be a valid MongoDB id.' });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'Book was not found.' });
  }

  const ruleError = validateBookRules(req.body, book);
  if (ruleError) {
    return res.status(422).json({ message: ruleError });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'author')) {
    if (!isValidId(req.body.author)) {
      return res.status(400).json({ message: 'author must be a valid MongoDB id.' });
    }

    const authorExists = await Author.exists({ _id: req.body.author });
    if (!authorExists) {
      return res.status(400).json({ message: 'The specified author does not exist.' });
    }
  }

  const nextTitle = Object.prototype.hasOwnProperty.call(req.body, 'title')
    ? req.body.title
    : book.title;
  const nextAuthor = Object.prototype.hasOwnProperty.call(req.body, 'author')
    ? req.body.author
    : book.author;

  if (typeof nextTitle === 'string' && nextTitle.trim() !== '') {
    const duplicate = await findDuplicateTitle(nextTitle, nextAuthor, book._id);
    if (duplicate) {
      return res.status(409).json({ message: 'This author already has a book with that title.' });
    }
  }

  for (const field of ['title', 'genre', 'price', 'publishedYear', 'author']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      book[field] = req.body[field];
    }
  }

  await book.save();
  await book.populate('author', 'name country bio');
  res.status(200).json(book);
}

async function deleteBook(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: 'Book id must be a valid MongoDB id.' });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'Book was not found.' });
  }

  await book.deleteOne();
  res.status(200).json({ message: 'Book deleted.' });
}

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook };