const User = require('../models/User');
const Result = require('../models/Result');
const StudentProgress = require('../models/StudentProgress');
const Test = require('../models/Test');
const Notification = require('../models/Notification');

// Get current profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Update profile details
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, schoolName, district, block, section, mobileNumber, parentName, parentMobile, profilePhoto } = req.body;

    const fieldsToUpdate = {
      fullName,
      schoolName,
      district,
      block,
      section,
      mobileNumber,
      parentName,
      parentMobile
    };

    if (profilePhoto) {
      fieldsToUpdate.profilePhoto = profilePhoto; // Handles base64 or custom URLs
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Get Student Dashboard Summary Stats
const getDashboardData = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Fetch user details for Streak & general info
    const user = await User.findById(studentId).select('fullName streak lastActiveDate schoolName badges');

    // Calculate Overall Rank
    // Rank is determined by sorting students by average result score
    const allStudentsResults = await Result.aggregate([
      { $group: { _id: '$student', avgScore: { $avg: '$percentage' } } },
      { $sort: { avgScore: -1 } }
    ]);

    let rank = 1;
    const rankIndex = allStudentsResults.findIndex(r => r._id.toString() === studentId.toString());
    if (rankIndex !== -1) {
      rank = rankIndex + 1;
    }

    // Today's Tests (available and not yet completed)
    const completedResults = await Result.find({ student: studentId }).select('test');
    const completedTestIds = completedResults.map(r => r.test.toString());

    const availableTests = await Test.find({ status: 'published' })
      .populate('subject', 'name')
      .populate('chapter', 'name')
      .lean();

    const todayTests = availableTests.filter(test => {
      const isCompleted = completedTestIds.includes(test._id.toString());
      if (isCompleted) return false;

      // Scheduled filter
      const now = new Date();
      const scheduled = test.scheduledFor ? new Date(test.scheduledFor) : null;
      const expiry = test.availableUntil ? new Date(test.availableUntil) : null;

      const isScheduledOk = !scheduled || scheduled <= now;
      const isExpiryOk = !expiry || expiry >= now;

      return isScheduledOk && isExpiryOk;
    }).slice(0, 3); // top 3 available

    // Overall Progress Stats
    const totalAttempted = completedTestIds.length;
    const avgScoreData = await Result.aggregate([
      { $match: { student: user._id } },
      { $group: { _id: null, avgPct: { $avg: '$percentage' } } }
    ]);
    const avgScore = avgScoreData.length > 0 ? parseFloat(avgScoreData[0].avgPct.toFixed(2)) : 0;

    // Recent results (last 3 tests)
    const recentResults = await Result.find({ student: studentId })
      .populate({
        path: 'test',
        select: 'title subject chapter',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'chapter', select: 'name' }
        ]
      })
      .sort({ attemptedAt: -1 })
      .limit(5)
      .lean();

    // Fetch notifications (global or targetted to student)
    const notifications = await Notification.find({
      $or: [{ user: null }, { user: studentId }]
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        rank,
        streak: user.streak || 0,
        todayTests,
        overallStats: {
          totalAttempted,
          avgScore,
          badgesCount: user.badges ? user.badges.length : 0
        },
        recentResults,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Progress Charts Data
const getProgressData = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. History of attempts (last 10 tests)
    const history = await Result.find({ student: studentId })
      .populate('test', 'title')
      .sort({ attemptedAt: 1 })
      .limit(10)
      .lean();

    const historyData = history.map(h => ({
      title: h.test ? h.test.title : 'Deleted Test',
      score: h.percentage,
      attemptedAt: h.attemptedAt
    }));

    // 2. Subject-wise progress
    const subjectProgress = await StudentProgress.find({ student: studentId })
      .populate('subject', 'name')
      .populate('strongChapters', 'name')
      .populate('weakChapters', 'name')
      .lean();

    const subjectData = subjectProgress.map(sp => ({
      subjectName: sp.subject ? sp.subject.name : 'Unknown',
      testsAttempted: sp.testsAttempted,
      averageScore: sp.averageScore,
      strongChapters: sp.strongChapters ? sp.strongChapters.map(c => c.name) : [],
      weakChapters: sp.weakChapters ? sp.weakChapters.map(c => c.name) : []
    }));

    res.status(200).json({
      success: true,
      data: {
        history: historyData,
        subjectProgress: subjectData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Leaderboard rankings
const getLeaderboard = async (req, res, next) => {
  try {
    // Aggregate overall percentages for all students
    const leaderboard = await Result.aggregate([
      {
        $group: {
          _id: '$student',
          avgPercentage: { $avg: '$percentage' },
          testsTaken: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] }
          }
        }
      },
      { $sort: { avgPercentage: -1, testsTaken: -1 } },
      { $limit: 20 }
    ]);

    // Populate user profile info
    const populatedLeaderboard = [];
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const user = await User.findById(entry._id).select('fullName schoolName profilePhoto streak');
      if (user) {
        populatedLeaderboard.push({
          rank: i + 1,
          userId: entry._id,
          fullName: user.fullName,
          schoolName: user.schoolName || 'Bihar Public School',
          profilePhoto: user.profilePhoto,
          streak: user.streak || 0,
          avgPercentage: parseFloat(entry.avgPercentage.toFixed(2)),
          testsTaken: entry.testsTaken,
          passedCount: entry.passedCount
        });
      }
    }

    res.status(200).json({ success: true, data: populatedLeaderboard });
  } catch (error) {
    next(error);
  }
};

// Get all Results
const getResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate({
        path: 'test',
        select: 'title totalMarks duration negativeMarking negativeMarkValue questions',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'chapter', select: 'name' }
        ]
      })
      .sort({ attemptedAt: -1 });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// Get Result Details by ID (Review answers mode - includes correctOption & explanation)
const getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({
        path: 'test',
        select: 'title totalMarks duration passingMarks'
      })
      .populate({
        path: 'answers.question',
        select: 'questionText options correctOption explanation imageUrl difficulty'
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Security: Students can only view their own test results
    if (req.user.role === 'student' && result.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this result sheet' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboardData,
  getProgressData,
  getLeaderboard,
  getResults,
  getResultById
};
