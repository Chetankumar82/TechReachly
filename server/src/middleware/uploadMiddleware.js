import multer from 'multer';

// Use memory storage to process PDF buffers directly
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'text/plain' ||
    file.originalname.endsWith('.pdf') ||
    file.originalname.endsWith('.txt')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or plain text resumes are supported'), false);
  }
};

export const uploadResume = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});
