import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      default: 'resume.pdf',
    },
    fileBuffer: {
      type: Buffer,
    },
    fileContentType: {
      type: String,
      default: 'application/pdf',
    },
    rawText: {
      type: String,
      default: '',
    },
    parsedData: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      currentRole: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      experienceMonths: { type: Number, default: 0 },
      isFresher: { type: Boolean, default: false },
      summary: { type: String, default: '' },
      skills: [{ type: String }],
      keyProjects: [
        {
          title: { type: String, default: '' },
          description: { type: String, default: '' },
          techStack: [{ type: String }],
          highlights: { type: String, default: '' },
          link: { type: String, default: '' },
        },
      ],
      links: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        resume: { type: String, default: '' },
      },
      education: [
        {
          degree: { type: String, default: '' },
          institution: { type: String, default: '' },
          year: { type: String, default: '' },
        },
      ],
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model('Resume', resumeSchema);
