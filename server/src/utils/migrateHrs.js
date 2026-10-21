import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { HRContact } from '../models/HRContact.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techreachly');
  const totalInDb = await HRContact.countDocuments({});
  console.log('Total HR contacts in DB:', totalInDb);
  const r = await HRContact.updateMany(
    {},
    { $set: { status: 'approved', verified: true } }
  );
  console.log('Updated legacy HR contacts:', r.modifiedCount);
  const totalApproved = await HRContact.countDocuments({ status: 'approved' });
  console.log('Total verified approved HR contacts:', totalApproved);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
