import { Router } from 'express';
import Book from '../models/book.model.js';

const router = Router();

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find()
      .populate('adminId', 'username email')
      .populate('ratings.userId', 'username');

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('adminId', 'username email')
      .populate('ratings.userId', 'username');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new book
router.post('/', async (req, res) => {
  try {
    const { title, caption } = req.body;
    
    const book = await Book.create({
      title,
      caption,
      adminId: req.user.id // From auth middleware
    });

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update book
router.put('/:id', async (req, res) => {
  try {
    const { title, caption } = req.body;
    
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user is the admin of the book
    if (book.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this book' });
    }

    book.title = title || book.title;
    book.caption = caption || book.caption;

    await book.save();

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user is the admin of the book
    if (book.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this book' });
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add rating to book
router.post('/:id/ratings', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user has already rated
    const existingRating = book.ratings.find(
      r => r.userId.toString() === req.user.id
    );

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this book' });
    }

    book.ratings.push({
      userId: req.user.id,
      rating,
      comment
    });

    await book.save();

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 