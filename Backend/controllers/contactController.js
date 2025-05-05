import Admin from '../models/Admin.js';
import nodemailer from 'nodemailer';

export const sendContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    // Get all admin emails
    const admins = await Admin.find({}, 'email');
    const adminEmails = admins.map(a => a.email);

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Contact form sent to admins via email!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send contact form', error: error.message });
  }
}; 