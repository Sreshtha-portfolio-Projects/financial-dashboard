import express from 'express';
import { asyncHandler } from '../lib/errorHandler.js';

const router = express.Router();

// Test endpoint to verify auth is working
router.get('/test', asyncHandler(async (req, res) => {
  res.json({ message: 'Auth routes are working' });
}));

export default router;

