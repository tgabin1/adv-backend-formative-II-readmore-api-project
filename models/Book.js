const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required.'],
      trim: true
    },
    genre: {
      type: String,
      required: [true, 'Book genre is required.'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Book price is required.'],
      min: [0.01, 'Price must be greater than zero.']
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required.'],
      min: [1450, 'Published year cannot be before 1450.'],
      max: [new Date().getFullYear(), 'Published year cannot be in the future.']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Book author is required.']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);