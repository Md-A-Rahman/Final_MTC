import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const tutorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    qualifications: {
      type: String,
      default: ''
    },
    assignedCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center',
      required: true
    },
    subjects: [{
      type: String,
      required: true
    }],
    sessionType: {
      type: String,
      enum: ['arabic', 'tuition'],
      required: true
    },
    sessionTiming: {
      type: String,
      enum: ['after_fajr', 'after_zohar', 'after_asar', 'after_maghrib', 'after_isha'],
      required: true
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
tutorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
tutorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Tutor = mongoose.model('Tutor', tutorSchema);

export default Tutor;