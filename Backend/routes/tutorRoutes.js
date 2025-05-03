import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getTutors,
  getTutor,
  createTutor,
  updateTutor,
  deleteTutor,
  getTutorAttendanceReport,
  getTutorPerformanceReport,
  getTutorStudentsReport
} from '../controllers/tutorController.js';

const router = express.Router();

// Tutor validation rules
const tutorValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('assignedCenter').isMongoId().withMessage('Invalid center ID'),
  body('subjects').isArray().withMessage('Subjects must be an array')
    .notEmpty().withMessage('At least one subject is required'),
  body('sessionType').isIn(['arabic', 'tuition']).withMessage('Invalid session type'),
  body('sessionTiming')
    .isIn(['after_fajr', 'after_zohar', 'after_asar', 'after_maghrib', 'after_isha'])
    .withMessage('Invalid session timing'),
  // Make these fields optional as they'll be filled by tutor later
  body('qualifications').optional(),
  body('documents.aadharNumber').optional(),
  body('documents.aadharPhoto').optional(),
  body('documents.bankAccount.accountNumber').optional(),
  body('documents.bankAccount.ifscCode').optional(),
  body('documents.bankAccount.passbookPhoto').optional(),
  body('documents.certificates').optional(),
  body('documents.memos').optional(),
  body('documents.resume').optional()
];

// Update validation - similar to create but all fields optional
const updateValidation = [
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('qualifications').optional().notEmpty().withMessage('Qualifications cannot be empty'),
  body('assignedCenter').optional().isMongoId().withMessage('Invalid center ID'),
  body('subjects').optional().isArray().withMessage('Subjects must be an array')
    .notEmpty().withMessage('At least one subject is required'),
  body('sessionType').optional().isIn(['arabic', 'tuition']).withMessage('Invalid session type'),
  body('sessionTiming').optional()
    .isIn(['after_fajr', 'after_zohar', 'after_asar', 'after_maghrib', 'after_isha'])
    .withMessage('Invalid session timing'),
  body('documents.aadharNumber').optional()
    .matches(/^[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/)
    .withMessage('Please enter a valid Aadhar number in format: XXXX XXXX XXXX'),
  body('documents.bankAccount.accountNumber').optional()
    .notEmpty()
    .withMessage('Bank account number cannot be empty'),
  body('documents.bankAccount.ifscCode').optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Please enter a valid IFSC code'),
  body('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
];

router.route('/')
  .get(protect, getTutors)
  .post(protect, adminOnly, tutorValidation, validateRequest, createTutor);

router.route('/:id')
  .get(protect, getTutor)
  .put(protect, adminOnly, updateValidation, validateRequest, updateTutor)
  .delete(protect, adminOnly, deleteTutor);

// Report routes
router.get('/:id/attendance', protect, getTutorAttendanceReport);
router.get('/:id/performance', protect, getTutorPerformanceReport);
router.get('/:id/students', protect, getTutorStudentsReport);

export default router;