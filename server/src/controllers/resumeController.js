import pdfParse from 'pdf-parse';
import { Resume } from '../models/Resume.js';
import { parseResumeWithGemini } from '../services/geminiService.js';

// @route   POST /api/resume/upload
export const uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or text resume' });
    }

    let rawText = '';

    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      const pdfData = await pdfParse(req.file.buffer);
      rawText = pdfData.text || '';
    } else {
      rawText = req.file.buffer.toString('utf-8');
    }

    if (!rawText.trim()) {
      return res.status(400).json({ success: false, message: 'Could not extract text from the uploaded file' });
    }

    console.log(`[ResumeController] Parsing resume for user ${req.user._id} (${rawText.length} characters)...`);

    // Parse structured data via Gemini 2.5 Flash
    const parsedData = await parseResumeWithGemini(rawText);

    // Update existing or create new
    let resume = await Resume.findOne({ userId: req.user._id });

    if (resume) {
      resume.fileName = req.file.originalname;
      resume.fileBuffer = req.file.buffer;
      resume.fileContentType = req.file.mimetype || 'application/pdf';
      resume.rawText = rawText;
      resume.parsedData = parsedData;
      await resume.save();
    } else {
      resume = await Resume.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        fileBuffer: req.file.buffer,
        fileContentType: req.file.mimetype || 'application/pdf',
        rawText,
        parsedData,
      });
    }

    const responseData = resume.toObject();
    responseData.hasFile = Boolean(resume.fileBuffer && resume.fileBuffer.length > 0);
    delete responseData.fileBuffer;

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('[ResumeController] Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/resume
export const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'No resume found for this user' });
    }
    const responseData = resume.toObject();
    responseData.hasFile = Boolean(resume.fileBuffer && resume.fileBuffer.length > 0);
    delete responseData.fileBuffer;

    res.json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/resume
export const updateResume = async (req, res) => {
  try {
    const { parsedData } = req.body;
    let resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      resume = await Resume.create({
        userId: req.user._id,
        fileName: 'Manual Profile',
        rawText: 'Manually configured candidate profile',
        parsedData,
      });
    } else {
      resume.parsedData = parsedData;
      resume.markModified('parsedData');
      await resume.save();
    }

    const responseData = resume.toObject();
    responseData.hasFile = Boolean(resume.fileBuffer && resume.fileBuffer.length > 0);
    delete responseData.fileBuffer;

    res.json({ success: true, message: 'Profile updated successfully', data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/resume
export const deleteResume = async (req, res) => {
  try {
    await Resume.findOneAndDelete({ userId: req.user._id });
    res.json({ success: true, message: 'Resume and profile dossier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
