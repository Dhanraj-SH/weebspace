import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { deleteProgress, getReadingProgess, saveProgress } from '../controllers/readingProgressController.js';

const router = Router();

router.get('/:mangaId', authenticate, getReadingProgess);
router.put('/:mangaId', authenticate, saveProgress);
router.delete('/:mangaId', authenticate, deleteProgress);

export default router;