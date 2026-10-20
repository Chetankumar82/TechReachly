import mongoose from 'mongoose';

const outreachLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hrContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HRContact',
      required: true,
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1, // 1 = Step 1 (Initial Pitch), 2 = Step 2 (Follow-up 1), 3 = Step 3 (Follow-up 2), 4 = Completed
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_queue', 'sent', 'opened', 'replied', 'bounced', 'paused', 'failed', 'completed'],
      default: 'scheduled',
      index: true,
    },
    nextSendAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSentAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    replyReceivedAt: {
      type: Date,
    },
    replyCategory: {
      type: String,
      enum: ['interview', 'positive', 'followup_later', 'not_hiring', 'general'],
      default: 'general',
    },
    replyNotes: {
      type: String,
      default: '',
    },
    stopReason: {
      type: String,
      default: '',
    },
    history: [
      {
        step: { type: Number, required: true },
        subject: { type: String, required: true },
        body: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        messageId: { type: String, default: '' },
        status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
        errorMessage: { type: String, default: '' },
        openedAt: { type: Date },
        openCount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const OutreachLog = mongoose.model('OutreachLog', outreachLogSchema);
