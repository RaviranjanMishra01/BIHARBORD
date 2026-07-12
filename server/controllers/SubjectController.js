const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

// Safe, multilingual slug generator supporting Devanagari and other scripts
const slugify = (text) => {
  if (!text) return 'default-' + Math.floor(Math.random() * 10000);
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\p{P}\p{S}]+/gu, '-') // Replace spaces and punctuation with dashes, keeping Unicode letters
    .replace(/^-+|-+$/g, '')           // Trim leading/trailing dashes
    || 'slug-' + Math.floor(Math.random() * 10000); // Fail-safe fallback
};

// Get all subjects
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

// Create Subject (Admin Only)
const createSubject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);

    const subject = await Subject.create({ name, slug, description });
    res.status(201).json({ success: true, message: 'Subject created successfully', data: subject });
  } catch (error) {
    next(error);
  }
};

// Get chapters for a subject
const getChapters = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const chapters = await Chapter.find({ subject: subjectId }).sort({ name: 1 });
    res.status(200).json({ success: true, data: chapters });
  } catch (error) {
    next(error);
  }
};

// Create Chapter under Subject (Admin Only)
const createChapter = async (req, res, next) => {
  try {
    const { name, subjectId, description } = req.body;
    const slug = slugify(name);

    const chapter = await Chapter.create({
      name,
      slug,
      subject: subjectId,
      description
    });

    res.status(201).json({ success: true, message: 'Chapter created successfully', data: chapter });
  } catch (error) {
    next(error);
  }
};

// Get Subjects and Chapters in tree format
const getSubjectsAndChapters = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    const chapters = await Chapter.find().sort({ name: 1 }).lean();

    const hierarchy = subjects.map(sub => {
      return {
        ...sub,
        chapters: chapters.filter(chap => chap.subject.toString() === sub._id.toString())
      };
    });

    res.status(200).json({ success: true, data: hierarchy });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  createSubject,
  getChapters,
  createChapter,
  getSubjectsAndChapters
};
