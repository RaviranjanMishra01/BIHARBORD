const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const xlsx = require('xlsx');

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

// Get questions (Admin filters, page pagination)
const getQuestions = async (req, res, next) => {
  try {
    const { subject, chapter, difficulty, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.questionText = { $regex: search, $options: 'i' };

    const skipIndex = (page - 1) * limit;
    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// Add Question
const addQuestion = async (req, res, next) => {
  try {
    const { questionText, options, correctOption, explanation, difficulty, subject, chapter, imageUrl } = req.body;

    const question = await Question.create({
      questionText,
      options,
      correctOption,
      explanation,
      difficulty,
      subject,
      chapter,
      imageUrl
    });

    res.status(201).json({ success: true, message: 'Question added successfully', data: question });
  } catch (error) {
    next(error);
  }
};

// Edit Question
const editQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Question.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({ success: true, message: 'Question updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// Delete Question
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bulk Import Questions from Excel File
const bulkImportQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    let importedCount = 0;
    const errors = [];

    // Cache subjects and chapters for speed
    const subjectsMap = {};
    const chaptersMap = {};

    const subjects = await Subject.find();
    subjects.forEach(sub => {
      subjectsMap[sub.name.toLowerCase().trim()] = sub._id;
    });

    const chapters = await Chapter.find();
    chapters.forEach(chap => {
      chaptersMap[chap.name.toLowerCase().trim()] = { id: chap._id, subjectId: chap.subject };
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Row index in Excel is 2-based

      const {
        QuestionText,
        Options, // Comma-separated options e.g. "A, B, C, D"
        CorrectOptionIndex, // 0, 1, 2, 3
        Explanation,
        Difficulty, // easy, medium, hard
        SubjectName,
        ChapterName
      } = row;

      if (!QuestionText || !Options || CorrectOptionIndex === undefined || !SubjectName || !ChapterName) {
        errors.push(`Row ${rowNum}: Missing required columns`);
        continue;
      }

      const subKey = SubjectName.toLowerCase().trim();
      const chapKey = ChapterName.toLowerCase().trim();

      let subjectId = subjectsMap[subKey];
      if (!subjectId) {
        // Create subject dynamically if not existing
        const slug = slugify(SubjectName);
        const newSub = await Subject.create({ name: SubjectName, slug });
        subjectId = newSub._id;
        subjectsMap[subKey] = subjectId;
      }

      let chapterInfo = chaptersMap[chapKey];
      let chapterId;
      if (!chapterInfo) {
        // Create chapter dynamically under this subject
        const slug = slugify(ChapterName);
        const newChap = await Chapter.create({ name: ChapterName, slug, subject: subjectId });
        chapterId = newChap._id;
        chaptersMap[chapKey] = { id: chapterId, subjectId };
      } else {
        chapterId = chapterInfo.id;
      }

      const optionList = Options.split(',').map(o => o.trim()).filter(Boolean);
      if (optionList.length < 2) {
        errors.push(`Row ${rowNum}: At least 2 options are required`);
        continue;
      }

      const correctIndex = parseInt(CorrectOptionIndex);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= optionList.length) {
        errors.push(`Row ${rowNum}: CorrectOptionIndex must be a number between 0 and ${optionList.length - 1}`);
        continue;
      }

      const diffVal = (Difficulty || 'medium').toLowerCase().trim();
      const validDifficulty = ['easy', 'medium', 'hard'].includes(diffVal) ? diffVal : 'medium';

      await Question.create({
        questionText: QuestionText,
        options: optionList,
        correctOption: correctIndex,
        explanation: Explanation || '',
        difficulty: validDifficulty,
        subject: subjectId,
        chapter: chapterId
      });

      importedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} questions`,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// Export Questions to Excel
const exportQuestions = async (req, res, next) => {
  try {
    const { subject, chapter, difficulty } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .lean();

    const data = questions.map((q, index) => ({
      'S.No': index + 1,
      'QuestionText': q.questionText,
      'Options': q.options.join(', '),
      'CorrectOptionIndex': q.correctOption,
      'Explanation': q.explanation,
      'Difficulty': q.difficulty,
      'SubjectName': q.subject ? q.subject.name : 'Unknown',
      'ChapterName': q.chapter ? q.chapter.name : 'Unknown'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Questions');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=questions_export.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Bulk Import Questions from JSON Array
const bulkImportJsonQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid JSON array of questions' });
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is empty' });
    }

    let importedCount = 0;
    const errors = [];

    // Cache subjects and chapters for speed
    const subjectsMap = {};
    const chaptersMap = {};

    const subjects = await Subject.find();
    subjects.forEach(sub => {
      subjectsMap[sub.name.toLowerCase().trim()] = sub._id;
    });

    const chapters = await Chapter.find();
    chapters.forEach(chap => {
      chaptersMap[chap.name.toLowerCase().trim()] = { id: chap._id, subjectId: chap.subject };
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const indexDisplay = i + 1;

      const {
        questionText,
        options,
        correctOption,
        explanation = '',
        difficulty = 'medium',
        subjectName,
        chapterName,
        imageUrl = ''
      } = q;

      if (!questionText || !options || correctOption === undefined || !subjectName || !chapterName) {
        errors.push(`Item ${indexDisplay}: Missing required fields (questionText, options, correctOption, subjectName, chapterName)`);
        continue;
      }

      if (!Array.isArray(options) || options.length < 2) {
        errors.push(`Item ${indexDisplay}: "options" must be a JSON array with at least 2 options`);
        continue;
      }

      const correctIndex = parseInt(correctOption);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        errors.push(`Item ${indexDisplay}: "correctOption" must be a valid index between 0 and ${options.length - 1}`);
        continue;
      }

      const subKey = subjectName.toLowerCase().trim();
      const chapKey = chapterName.toLowerCase().trim();

      let subjectId = subjectsMap[subKey];
      if (!subjectId) {
        // Create subject dynamically if not existing
        const slug = slugify(subjectName);
        const newSub = await Subject.create({ name: subjectName, slug });
        subjectId = newSub._id;
        subjectsMap[subKey] = subjectId;
      }

      let chapterInfo = chaptersMap[chapKey];
      let chapterId;
      if (!chapterInfo) {
        // Create chapter dynamically under this subject
        const slug = slugify(chapterName);
        const newChap = await Chapter.create({ name: chapterName, slug, subject: subjectId });
        chapterId = newChap._id;
        chaptersMap[chapKey] = { id: chapterId, subjectId };
      } else {
        chapterId = chapterInfo.id;
      }

      const diffVal = ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase().trim())
        ? difficulty.toLowerCase().trim()
        : 'medium';

      await Question.create({
        questionText: questionText.trim(),
        options: options.map(o => o.toString().trim()),
        correctOption: correctIndex,
        explanation: explanation.trim(),
        difficulty: diffVal,
        subject: subjectId,
        chapter: chapterId,
        imageUrl: imageUrl.trim()
      });

      importedCount++;
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${importedCount} of ${questions.length} questions.`,
      importedCount,
      errors
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  addQuestion,
  editQuestion,
  deleteQuestion,
  bulkImportQuestions,
  exportQuestions,
  bulkImportJsonQuestions
};
