const mongoose = require('mongoose');
const Book = require('../models/Book');

function isValidId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

function validateBookRules(values, existingBook = {}) {
  const price = Object.prototype.hasOwnProperty.call(values, 'price')
    ? values.price
    : existingBook.price;
  const publishedYear = Object.prototype.hasOwnProperty.call(values, 'publishedYear')
    ? values.publishedYear
    : existingBook.publishedYear;

  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return 'Price must be a number greater than zero.';
  }

  const currentYear = new Date().getFullYear();
  if (
    typeof publishedYear !== 'number' ||
    !Number.isInteger(publishedYear) ||
    publishedYear < 1450 ||
    publishedYear > currentYear
  ) {
    return 'Published year must be a whole number from 1450 through ' + currentYear + '.';
  }

  return null;
}

function escapeRegularExpression(value) {
  return value.split('').map((character) => {
    return '.^$*+?()[]{}|\\'.includes(character) ? '\\' + character : character;
  }).join('');
}

async function findDuplicateTitle(title, authorId, ignoreBookId) {
  const filter = {
    author: new mongoose.Types.ObjectId(authorId),
    title: {
      $regex: '^' + escapeRegularExpression(title.trim()) + '$',
      $options: 'i'
    }
  };

  if (ignoreBookId) {
    filter._id = { $ne: ignoreBookId };
  }

  return Book.findOne(filter);
}

module.exports = { isValidId, validateBookRules, findDuplicateTitle };