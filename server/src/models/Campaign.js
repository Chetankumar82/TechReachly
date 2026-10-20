import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'active',
      index: true,
    },
    attachResume: {
      type: Boolean,
      default: true,
    },
    targetContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HRContact',
      },
    ],
    sequenceTemplates: {
      step1: {
        subject: { type: String, default: '' },
        body: { type: String, default: '' },
      },
      step2: {
        delayDays: { type: Number, default: 3 },
        subject: { type: String, default: '' },
        body: { type: String, default: '' },
      },
      step3: {
        delayDays: { type: Number, default: 4 },
        subject: { type: String, default: '' },
        body: { type: String, default: '' },
      },
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      replied: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model('Campaign', campaignSchema);
