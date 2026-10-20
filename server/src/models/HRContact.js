import mongoose from 'mongoose';

const hrContactSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: 'IT / Software Services',
      trim: true,
    },
    companySize: {
      type: String,
      default: '50-200',
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    recruiterName: {
      type: String,
      required: [true, 'Recruiter name is required'],
      trim: true,
    },
    recruiterEmail: {
      type: String,
      required: [true, 'Recruiter email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    recruiterTitle: {
      type: String,
      default: 'Technical Recruiter',
      trim: true,
    },
    linkedinUrl: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote / India',
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    tier: {
      type: String,
      enum: ['all', 'big_tech', 'unicorn', 'fintech', 'startup', 'remote', 'general'],
      default: 'general',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound text index for powerful multi-field search (company, recruiter, techStack, location)
hrContactSchema.index({
  companyName: 'text',
  recruiterName: 'text',
  techStack: 'text',
  location: 'text',
  industry: 'text',
});

export const HRContact = mongoose.model('HRContact', hrContactSchema);
