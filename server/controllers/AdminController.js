const User = require('../models/User');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Result = require('../models/Result');
const ActivityLog = require('../models/ActivityLog');
const xlsx = require('xlsx');

// 1. Get Dashboard Summary and Charts Data
const getDashboardStats = async (req, res, next) => {
  try {
    // Basic counts
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({
      role: 'student',
      lastActiveDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
    });
    const totalTests = await Test.countDocuments();
    const totalQuestions = await Question.countDocuments();

    // Average Marks & Pass Percentage
    const resultsStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalAttempts: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] }
          }
        }
      }
    ]);

    const averagePercentage = resultsStats.length > 0 ? parseFloat(resultsStats[0].avgPercentage.toFixed(2)) : 0;
    const totalAttempts = resultsStats.length > 0 ? resultsStats[0].totalAttempts : 0;
    const passedCount = resultsStats.length > 0 ? resultsStats[0].passedCount : 0;
    const passPercentage = totalAttempts > 0 ? parseFloat(((passedCount / totalAttempts) * 100).toFixed(2)) : 0;

    // Subject-wise performance metrics
    const subjectWisePerformance = await Result.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      { $unwind: '$testDetails' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'testDetails.subject',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      { $unwind: '$subjectDetails' },
      {
        $group: {
          _id: '$subjectDetails._id',
          name: { $first: '$subjectDetails.name' },
          avgScore: { $avg: '$percentage' },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    const subjectAnalytics = subjectWisePerformance.map(s => ({
      subjectName: s.name,
      averagePercentage: parseFloat(s.avgScore.toFixed(2)),
      attempts: s.attempts
    }));

    // Weak Subjects & Weak Chapters (Simulated based on lowest average percentages)
    const weakSubjects = subjectAnalytics
      .filter(s => s.averagePercentage < 50)
      .slice(0, 3);

    // Activity Log list (last 10 entries)
    const recentActivities = await ActivityLog.find()
      .populate('user', 'fullName email role')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Chart: Daily Attempts over last 7 days
    const dailyAttempts = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await Result.countDocuments({
        attemptedAt: { $gte: startOfDay, $lte: endOfDay }
      });

      dailyAttempts.push({
        date: startOfDay.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        attempts: count
      });
    }

    // Leaderboard
    const topStudents = await Result.aggregate([
      {
        $group: {
          _id: '$student',
          avgPercentage: { $avg: '$percentage' },
          testsTaken: { $sum: 1 }
        }
      },
      { $sort: { avgPercentage: -1 } },
      { $limit: 5 }
    ]);

    const populatedTopStudents = [];
    for (let i = 0; i < topStudents.length; i++) {
      const entry = topStudents[i];
      const studentObj = await User.findById(entry._id).select('fullName schoolName district');
      if (studentObj) {
        populatedTopStudents.push({
          rank: i + 1,
          fullName: studentObj.fullName,
          schoolName: studentObj.schoolName || 'N/A',
          district: studentObj.district || 'N/A',
          avgPercentage: parseFloat(entry.avgPercentage.toFixed(2)),
          testsTaken: entry.testsTaken
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        counters: {
          totalStudents,
          activeStudents,
          totalTests,
          totalQuestions,
          passPercentage,
          averagePercentage
        },
        subjectAnalytics,
        weakSubjects,
        recentActivities,
        dailyAttempts,
        topStudents: populatedTopStudents
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Students List management (filters, sorting, pagination)
const getStudents = async (req, res, next) => {
  try {
    const { search, district, block, isSuspended, page = 1, limit = 10 } = req.query;

    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (district) query.district = district;
    if (block) query.block = block;
    if (isSuspended !== undefined && isSuspended !== '') {
      query.isSuspended = isSuspended === 'true';
    }

    const skipIndex = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// Add Student manually
const addStudent = async (req, res, next) => {
  try {
    const { email } = req.body;
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const student = await User.create({
      ...req.body,
      role: 'student'
    });

    student.password = undefined;
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    next(error);
  }
};

// Edit Student manually
const editStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    next(error);
  }
};

// Delete Student
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Clear related student results
    await Result.deleteMany({ student: id });
    await StudentProgress.deleteMany({ student: id });

    res.status(200).json({ success: true, message: 'Student account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Toggle Suspension status
const toggleSuspendStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    await ActivityLog.create({
      user: req.user.id,
      action: `${user.isSuspended ? 'Suspended' : 'Activated'} student account: ${user.email}`,
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: `Student account successfully ${user.isSuspended ? 'suspended' : 'activated'}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Import Students from Excel
const bulkImportStudents = async (req, res, next) => {
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

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const {
        FullName,
        Email,
        Password,
        RollNumber,
        SchoolName,
        District,
        Block,
        MobileNumber,
        ParentName,
        ParentMobile
      } = row;

      if (!FullName || !Email || !Password) {
        errors.push(`Row ${rowNum}: Name, Email and Password are required`);
        continue;
      }

      const exists = await User.findOne({ email: Email.toLowerCase().trim() });
      if (exists) {
        errors.push(`Row ${rowNum}: Email '${Email}' is already registered`);
        continue;
      }

      await User.create({
        fullName: FullName,
        email: Email.toLowerCase().trim(),
        password: Password.toString(),
        rollNumber: RollNumber ? RollNumber.toString() : '',
        schoolName: SchoolName || '',
        district: District || '',
        block: Block || '',
        mobileNumber: MobileNumber ? MobileNumber.toString() : '',
        parentName: ParentName || '',
        parentMobile: ParentMobile ? ParentMobile.toString() : '',
        role: 'student'
      });

      importedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} students`,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// Export Students to Excel
const exportStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).lean();

    const data = students.map((s, index) => ({
      'S.No': index + 1,
      'FullName': s.fullName,
      'Email': s.email,
      'RollNumber': s.rollNumber || 'N/A',
      'SchoolName': s.schoolName || 'N/A',
      'District': s.district || 'N/A',
      'Block': s.block || 'N/A',
      'Mobile': s.mobileNumber || 'N/A',
      'ParentName': s.parentName || 'N/A',
      'Suspended': s.isSuspended ? 'Yes' : 'No'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getAllResults = async (req, res, next) => {
  try {
    const results = await Result.find()
      .populate('student', 'fullName email rollNumber')
      .populate({
        path: 'test',
        select: 'title subject chapter totalMarks',
        populate: [
          { path: 'subject', select: 'name' }
        ]
      })
      .sort({ attemptedAt: -1 });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// Fetch all login activity audit logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (search) {
      // Find users matching search term
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.$or = [
        { user: { $in: userIds } },
        { action: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'fullName email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  addStudent,
  editStudent,
  deleteStudent,
  toggleSuspendStudent,
  bulkImportStudents,
  exportStudents,
  getAllResults,
  getAuditLogs
};
