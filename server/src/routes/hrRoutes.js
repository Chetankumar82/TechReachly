import express from 'express';
import {
  getContacts,
  getTechStacks,
  createContact,
  bulkCreate,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
} from '../controllers/hrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getContacts);
router.get('/tech-stacks', getTechStacks);
router.post('/', createContact);
router.post('/bulk', bulkCreate);
router.post('/bulk-delete', bulkDeleteContacts);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
