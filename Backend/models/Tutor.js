import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const tutorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  qualifications: {
    type: String,
    default: ''
  },
  assignedCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: [true, 'Center is required']
  },
  subjects: [{
    type: String,
    required: [true, 'At least one subject is required']
  }],
  sessionType: {
    type: String,
    enum: ['arabic', 'tuition'],
    required: [true, 'Session type is required']
  },
  sessionTiming: {
    type: String,
    enum: ['after_fajr', 'after_zohar', 'after_asar', 'after_maghrib', 'after_isha'],
    required: [true, 'Session timing is required']
  },
  documents: {
    aadharNumber: {
      type: String,
      default: ''
    },
    aadharPhoto: {
      type: String,
      default: null
    },
    bankAccount: {
      accountNumber: {
        type: String,
        default: ''
      },
      ifscCode: {
        type: String,
        default: ''
      },
      passbookPhoto: {
        type: String,
        default: null
      }
    },
    certificates: {
      type: [String],
      default: null
    },
    memos: {
      type: [String],
      default: null
    },
    resume: {
      type: String,
      default: null
    }
  },
  role: {
    type: String,
    default: 'tutor'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  assignmentInformation: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: false,
      validate: {
        validator: function(v) {
          return v === undefined || (Array.isArray(v) && v.length === 2 && 
            typeof v[0] === 'number' && typeof v[1] === 'number' &&
            v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90);
        },
        message: 'Coordinates must be [longitude, latitude] with valid values'
      }
    }
  }
}, {
  timestamps: true
});

// Create geospatial index
tutorSchema.index({ location: '2dsphere' });

// Encrypt password using bcrypt
tutorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next(); // <- add return here to exit properly
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Match user entered password to hashed password in database
tutorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Tutor = mongoose.model('Tutor', tutorSchema);

export default Tutor;