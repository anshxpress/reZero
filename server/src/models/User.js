import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    index: true,
    sparse: true // Allow null during generation
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    defaultAgents: [{
      type: String,
      enum: ['data_extraction', 'financial_analysis', 'news_summarization', 'analyst_support', 'recommender']
    }],
    notificationSettings: {
      email: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ createdAt: -1 });

// Generate custom userId
function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'USR-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Generate userId before first save
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    let userId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      userId = generateUserId();
      const existing = await mongoose.model('User').findOne({ userId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return next(new Error('Failed to generate unique userId'));
    }

    this.userId = userId;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);
