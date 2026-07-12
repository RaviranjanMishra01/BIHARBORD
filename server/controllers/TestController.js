const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const StudentProgress = require('../models/StudentProgress');
const ActivityLog = require('../models/ActivityLog');

// Get all tests for admin
const getTestsAdmin = async (req, res, next) => {
  try {
    const tests = await Test.find()
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

// Create a test (Admin Only)
const createTest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      chapter,
      questions, // array of question IDs
      duration,
      totalMarks,
      passingMarks,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions,
      randomizeOptions,
      scheduledFor,
      availableUntil,
      status,
      type
    } = req.body;

    const test = await Test.create({
      title,
      description,
      subject,
      chapter: chapter || null,
      questions,
      duration,
      totalMarks,
      passingMarks,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions,
      randomizeOptions,
      scheduledFor,
      availableUntil,
      status,
      type
    });

    res.status(201).json({ success: true, message: 'Test created successfully', data: test });
  } catch (error) {
    next(error);
  }
};

// Edit Test (Admin Only)
const editTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await Test.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    res.status(200).json({ success: true, message: 'Test updated successfully', data: test });
  } catch (error) {
    next(error);
  }
};

// Delete Test (Admin Only)
const deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Test.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    res.status(200).json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get tests for students (Available, Upcoming, Completed)
const getTestsStudent = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const currentTime = new Date();

    // Find all results of this student
    const completedResults = await Result.find({ student: studentId }).select('test score status');
    const completedTestIds = completedResults.map(r => r.test.toString());

    // Fetch published tests
    const allPublishedTests = await Test.find({ status: 'published' })
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .sort({ scheduledFor: 1 });

    const available = [];
    const upcoming = [];
    const completed = [];

    allPublishedTests.forEach(test => {
      const isCompleted = completedTestIds.includes(test._id.toString());
      const testResult = completedResults.find(r => r.test.toString() === test._id.toString());

      const data = {
        ...test.toObject(),
        isCompleted,
        userResult: testResult ? { score: testResult.score, status: testResult.status } : null
      };

      if (isCompleted) {
        completed.push(data);
      } else {
        const scheduledTime = test.scheduledFor ? new Date(test.scheduledFor) : null;
        const endTime = test.availableUntil ? new Date(test.availableUntil) : null;

        if (scheduledTime && scheduledTime > currentTime) {
          upcoming.push(data);
        } else if (endTime && endTime < currentTime) {
          // expired and not taken
        } else {
          available.push(data);
        }
      }
    });

    res.status(200).json({
      success: true,
      data: { available, upcoming, completed }
    });
  } catch (error) {
    next(error);
  }
};

// Get test details for attempt (Secure: removes correctOption & explanation)
const getTestDetails = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .populate('questions');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    if (test.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'This test is not published yet' });
    }

    // Strip answers if requesting user is a student to prevent cheat inspector viewing
    const testObj = test.toObject();
    if (req.user.role === 'student') {
      testObj.questions = testObj.questions.map(q => {
        return {
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          imageUrl: q.imageUrl,
          type: q.type
        };
      });
    }

    res.status(200).json({ success: true, data: testObj });
  } catch (error) {
    next(error);
  }
};

// Submit Test
const submitTest = async (req, res, next) => {
  try {
    const testId = req.params.id;
    const studentId = req.user.id;
    const { answers, timeTaken } = req.body; // answers is an array: [{ questionId, chosenOption }]

    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Double attempt check
    const existingResult = await Result.findOne({ student: studentId, test: testId });
    if (existingResult) {
      return res.status(400).json({ success: false, message: 'Test already attempted' });
    }

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const scoredAnswers = [];

    // Map questions for quick access
    const questionsMap = {};
    test.questions.forEach(q => {
      questionsMap[q._id.toString()] = q;
    });

    test.questions.forEach(q => {
      const studentAns = answers.find(a => a.questionId === q._id.toString());
      const chosenOption = studentAns ? studentAns.chosenOption : null;

      if (chosenOption === null || chosenOption === undefined) {
        skippedCount++;
        scoredAnswers.push({
          question: q._id,
          chosenOption: null,
          isCorrect: false,
          isSkipped: true
        });
      } else {
        const isCorrect = q.correctOption === chosenOption;
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }

        scoredAnswers.push({
          question: q._id,
          chosenOption,
          isCorrect,
          isSkipped: false
        });
      }
    });

    // Score Calculations
    // Correct gives positive score, Incorrect gives negative deduction if enabled
    const questionValue = test.totalMarks / test.questions.length;
    let calculatedScore = correctCount * questionValue;

    if (test.negativeMarking) {
      calculatedScore -= wrongCount * (test.negativeMarkValue || 0);
    }

    // Cap score at 0
    calculatedScore = Math.max(0, parseFloat(calculatedScore.toFixed(2)));
    const percentage = parseFloat(((calculatedScore / test.totalMarks) * 100).toFixed(2));
    const status = percentage >= test.passingMarks ? 'passed' : 'failed';

    const result = await Result.create({
      student: studentId,
      test: testId,
      answers: scoredAnswers,
      score: calculatedScore,
      percentage,
      status,
      timeTaken // in seconds
    });

    // Update Student progress statistics
    let progress = await StudentProgress.findOne({ student: studentId, subject: test.subject });
    if (!progress) {
      progress = new StudentProgress({ student: studentId, subject: test.subject });
    }

    const previousTotal = progress.testsAttempted || 0;
    const previousAvg = progress.averageScore || 0;
    progress.testsAttempted += 1;
    progress.averageScore = parseFloat((((previousAvg * previousTotal) + percentage) / progress.testsAttempted).toFixed(2));

    // Update Weak and Strong chapters based on performance
    if (test.chapter) {
      if (status === 'passed') {
        // Add to strong chapters, remove from weak chapters
        if (!progress.strongChapters.includes(test.chapter)) {
          progress.strongChapters.push(test.chapter);
        }
        progress.weakChapters = progress.weakChapters.filter(c => c.toString() !== test.chapter.toString());
      } else {
        // Add to weak chapters, remove from strong chapters
        if (!progress.weakChapters.includes(test.chapter)) {
          progress.weakChapters.push(test.chapter);
        }
        progress.strongChapters = progress.strongChapters.filter(c => c.toString() !== test.chapter.toString());
      }
    }

    await progress.save();

    // Log Activity
    await ActivityLog.create({
      user: studentId,
      action: `Attempted test: ${test.title} - Score: ${calculatedScore}/${test.totalMarks} (${status.toUpperCase()})`,
      ipAddress: req.ip || ''
    });

    res.status(201).json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        resultId: result._id,
        score: calculatedScore,
        totalMarks: test.totalMarks,
        percentage,
        status,
        correctCount,
        wrongCount,
        skippedCount,
        timeTaken
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestsAdmin,
  createTest,
  editTest,
  deleteTest,
  getTestsStudent,
  getTestDetails,
  submitTest
};
