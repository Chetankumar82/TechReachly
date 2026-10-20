import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'admin'],
      default: 'candidate',
    },
    // Mailbox/SMTP configuration for cold email sending
    smtpConfig: {
      host: { type: String, default: 'smtp.gmail.com' },
      port: { type: Number, default: 465 },
      secure: { type: Boolean, default: true },
      authUser: { type: String, default: '' },
      authPass: { type: String, default: '' }, // Stored securely/app password
      senderName: { type: String, default: '' },
      verified: { type: Boolean, default: false },
      lastVerifiedAt: { type: Date },
    },
    // Outreach deliverability and anti-spam controls
    outreachSettings: {
      dailyLimit: { type: Number, default: 25 },
      minDelaySeconds: { type: Number, default: 180 }, // 3 minutes
      maxDelaySeconds: { type: Number, default: 360 }, // 6 minutes
      autoFollowUp: { type: Boolean, default: true },
      followUpDelayDays: { type: Number, default: 3 },
    },
    // User Gemini API Key (Optional override)
    geminiApiKey: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
