console.log('Tutor Application Controller loaded');
import TutorApplication from '../models/TutorApplication.js';

// POST /api/tutor-applications
export const createTutorApplication = async (req, res) => {
  try {
    const application = await TutorApplication.create(req.body);
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
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