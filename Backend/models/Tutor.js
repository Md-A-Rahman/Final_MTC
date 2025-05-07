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
      required: function() { return this.isNew; }
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
    assignedHadiyaAmount: {
      type: Number,
      required: false, // Consider if this should be true if it's always set during tutor creation
      default: 0
    },
    hadiyaRecords: [{
      month: { type: Number, required: true }, // e.g., 1 for January, 12 for December
      year: { type: Number, required: true },  // e.g., 2023
      amountPaid: { type: Number, required: true },
      datePaid: { type: Date, default: Date.now },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // Assuming you have an Admin model
      notes: { type: String, trim: true, default: '' }
    }],
    attendance: [{
      date: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          required: true
        }
      },
      center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center',
        required: true
      },
      centerName: {
        type: String,
        required: true
      }
    }]
  },
  {
    timestamps: true
  }
);

// Create indexes for geospatial queries
tutorSchema.index({ 'attendance.location': '2dsphere' });

// Hash password before saving
tutorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Validate password length when creating a new tutor
tutorSchema.pre('save', function(next) {
  if (this.isNew && this.password && this.password.length < 6) {
    next(new Error('Password must be at least 6 characters long'));
  } else {
    next();
  }
});

// Match password method
tutorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Tutor = mongoose.model('Tutor', tutorSchema);

export default Tutor;