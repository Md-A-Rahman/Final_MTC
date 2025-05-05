console.log('Tutor Application Controller loaded');
import TutorApplication from '../models/TutorApplication.js';
import Admin from '../models/Admin.js';
import nodemailer from 'nodemailer';

// POST /api/tutor-applications
export const createTutorApplication = async (req, res) => {
  try {
    // Get all admin emails
    const admins = await Admin.find({}, 'email');
    const adminEmails = admins.map(a => a.email);

    // Set up Nodemailer transporter (example with Gmail, use env vars in production)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Prepare attachments
    const attachments = [];
    ['certificates', 'memos', 'resume'].forEach(field => {
      if (req.files && req.files[field]) {
        attachments.push({
          filename: req.files[field][0].originalname,
          content: req.files[field][0].buffer
        });
      }
    });

    // Prepare email body
    const { fullName, email, phone, qualifications } = req.body;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: 'New Tutor Application',
      text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nQualifications: ${qualifications}`,
      attachments
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Application sent to admins via email!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send application', error: error.message });
  }
};

// GET /api/tutor-applications
export const getTutorApplications = async (req, res) => {
  try {
    const applications = await TutorApplication.find().sort({ createdAt: -1 }).limit(10);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 