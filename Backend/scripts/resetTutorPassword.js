import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Tutor from '../models/Tutor.js';

mongoose.connect('mongodb://localhost:27017/YOUR_DB_NAME'); // Replace with your DB name

async function resetPassword() {
  const phone = '9347887085'.trim();
  const newPassword = 'tutor@123'.trim();
  const tutor = await Tutor.findOne({ phone });
  if (!tutor) {
    console.log('Tutor not found');
    process.exit();
  }
  // Always hash the password before saving
  tutor.password = newPassword; // pre('save') hook will hash it
  await tutor.save();
  console.log('Password reset!');
  console.log('Phone:', phone);
  console.log('Password set to:', newPassword);
  console.log('Hash in DB:', tutor.password);
  process.exit();
}

// This script will hash the password using the pre-save hook.
resetPassword(); 