import express from 'express';
import {
  getContacts,
  getTechStacks,
  createContact,
  getMySubmissions,
  deleteMySubmission,
  getAdminPendingContacts,
  getAdminStats,
  approveContact,
  rejectContact,
  bulkCreate,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
} from '../controllers/hrController.js';
import { protect, optionalProtect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public & Semi-Public Directory Views (Masks emails for guests)
router.get('/', optionalProtect, getContacts);
router.get('/tech-stacks', optionalProtect, getTechStacks);

// Candidate Actions (Authenticated)
router.post('/', protect, createContact);
router.get('/my-submissions', protect, getMySubmissions);
router.delete('/my-submissions/:id', protect, deleteMySubmission);

// Admin Moderation Hub Actions (Authenticated + Admin Role)
router.get('/admin/pending', protect, requireAdmin, getAdminPendingContacts);
router.get('/admin/stats', protect, requireAdmin, getAdminStats);
router.post('/admin/:id/approve', protect, requireAdmin, approveContact);
router.post('/admin/:id/reject', protect, requireAdmin, rejectContact);

// Batch & Direct Operations
router.post('/bulk', protect, bulkCreate);
router.post('/bulk-delete', protect, bulkDeleteContacts);
router.put('/:id', protect, updateContact);
router.delete('/:id', protect, deleteContact);

export default router;
