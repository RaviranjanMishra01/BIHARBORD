const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Result = require('../models/Result');
const StudentProgress = require('../models/StudentProgress');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biharboard');
    console.log('Database connected successfully.');

    // Clear existing data
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Question.deleteMany({});
    await Test.deleteMany({});
    await Result.deleteMany({});
    await StudentProgress.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Collections cleared.');

    // 1. Create Admins & Students
    console.log('Seeding Users...');
    const admin = await User.create({
      fullName: 'Bihar Board Admin',
      email: 'admin@biharboard.org',
      password: 'adminpassword123',
      role: 'admin',
      mobileNumber: '9999999999'
    });

    const student = await User.create({
      fullName: 'Rahul Kumar',
      email: 'student@biharboard.org',
      password: 'studentpassword123',
      role: 'student',
      rollNumber: '260012',
      schoolName: 'Zila School, Patna',
      district: 'Patna',
      block: 'Patna Sadar',
      class: '10',
      section: 'A',
      mobileNumber: '8888888888',
      parentName: 'Ramesh Singh',
      parentMobile: '7777777777',
      streak: 5,
      lastActiveDate: new Date()
    });
    console.log('Users seeded.');

    // 2. Create Subjects
    console.log('Seeding Subjects...');
    const subjectsData = [
      { name: 'Mathematics', slug: 'mathematics', description: 'Class 10 Bihar Board Mathematics course' },
      { name: 'Science', slug: 'science', description: 'Class 10 Bihar Board Science course' },
      { name: 'Social Science', slug: 'social-science', description: 'Class 10 Bihar Board Social Science course' },
      { name: 'English', slug: 'english', description: 'Class 10 Bihar Board English course' },
      { name: 'Hindi', slug: 'hindi', description: 'Class 10 Bihar Board Hindi course' },
      { name: 'Sanskrit', slug: 'sanskrit', description: 'Class 10 Bihar Board Sanskrit course' }
    ];

    const subjects = {};
    for (const sub of subjectsData) {
      const createdSub = await Subject.create(sub);
      subjects[sub.name] = createdSub;
    }
    console.log('Subjects seeded.');

    // 3. Create Chapters
    console.log('Seeding Chapters...');
    const mathChapters = [
      { name: 'Real Numbers (वास्तविक संख्याएँ)', slug: 'real-numbers', subject: subjects['Mathematics']._id },
      { name: 'Polynomials (बहुपद)', slug: 'polynomials', subject: subjects['Mathematics']._id },
      { name: 'Quadratic Equations (द्विघात समीकरण)', slug: 'quadratic-equations', subject: subjects['Mathematics']._id },
      { name: 'Trigonometry (त्रिकोणमिति)', slug: 'trigonometry', subject: subjects['Mathematics']._id }
    ];

    const scienceChapters = [
      { name: 'Chemical Reactions (रासायनिक अभिक्रियाएं)', slug: 'chemical-reactions', subject: subjects['Science']._id },
      { name: 'Acids, Bases & Salts (अम्ल, क्षारक एवं लवण)', slug: 'acids-bases-salts', subject: subjects['Science']._id },
      { name: 'Life Processes (जैव प्रक्रम)', slug: 'life-processes', subject: subjects['Science']._id },
      { name: 'Reflection of Light (प्रकाश का परावर्तन)', slug: 'reflection-of-light', subject: subjects['Science']._id }
    ];

    const mathChaps = [];
    for (const chap of mathChapters) {
      const c = await Chapter.create(chap);
      mathChaps.push(c);
    }

    const scienceChaps = [];
    for (const chap of scienceChapters) {
      const c = await Chapter.create(chap);
      scienceChaps.push(c);
    }
    console.log('Chapters seeded.');

    // 4. Create Questions
    console.log('Seeding Questions...');
    const questionsData = [
      {
        questionText: 'What is the value of √2? / √2 का मान क्या है?',
        options: ['1.414', '1.732', '2.236', '1.000'],
        correctOption: 0,
        explanation: '√2 is approximately 1.414, and it is an irrational number.',
        difficulty: 'easy',
        subject: subjects['Mathematics']._id,
        chapter: mathChaps[0]._id // Real numbers
      },
      {
        questionText: 'Which of the following is a rational number? / निम्नलिखित में से कौन सी परिमेय संख्या है?',
        options: ['√3', 'π', '22/7', '√5'],
        correctOption: 2,
        explanation: '22/7 is represented in p/q form where p and q are integers, making it a rational number.',
        difficulty: 'easy',
        subject: subjects['Mathematics']._id,
        chapter: mathChaps[0]._id
      },
      {
        questionText: 'What is the sum of roots of the quadratic equation ax² + bx + c = 0? / द्विघात समीकरण ax² + bx + c = 0 के मूलों का योग क्या होता है?',
        options: ['c/a', '-b/a', 'b/a', '-c/a'],
        correctOption: 1,
        explanation: 'The sum of roots (α + β) of a quadratic equation ax² + bx + c = 0 is given by -b/a.',
        difficulty: 'medium',
        subject: subjects['Mathematics']._id,
        chapter: mathChaps[2]._id // Quadratic Equations
      },
      {
        questionText: 'What is the value of sin²θ + cos²θ? / sin²θ + cos²θ का मान क्या होता है?',
        options: ['0', '1', '2', '-1'],
        correctOption: 1,
        explanation: 'It is a fundamental trigonometric identity: sin²θ + cos²θ = 1.',
        difficulty: 'easy',
        subject: subjects['Mathematics']._id,
        chapter: mathChaps[3]._id // Trigonometry
      },
      {
        questionText: 'If sec θ + tan θ = x, then find the value of sec θ - tan θ. / यदि sec θ + tan θ = x, तो sec θ - tan θ का मान ज्ञात करें।',
        options: ['x', '1/x', 'x²', '2x'],
        correctOption: 1,
        explanation: 'Since sec²θ - tan²θ = 1, (sec θ - tan θ)(sec θ + tan θ) = 1. Thus sec θ - tan θ = 1/x.',
        difficulty: 'hard',
        subject: subjects['Mathematics']._id,
        chapter: mathChaps[3]._id
      },
      {
        questionText: 'What gas is evolved when Zinc reacts with dilute Sulphuric acid? / जब जस्ता तनु सल्फ्यूरिक अम्ल के साथ अभिक्रिया करता है, तो कौन सी गैस निकलती है?',
        options: ['Oxygen', 'Carbon dioxide', 'Hydrogen', 'Nitrogen'],
        correctOption: 2,
        explanation: 'Zn + H₂SO₄ → ZnSO₄ + H₂. Hydrogen gas is released.',
        difficulty: 'easy',
        subject: subjects['Science']._id,
        chapter: scienceChaps[0]._id // Chemical Reactions
      },
      {
        questionText: 'What is the pH value of a neutral solution? / उदासीन विलयन का pH मान क्या होता है?',
        options: ['7', 'Less than 7', 'More than 7', '0'],
        correctOption: 0,
        explanation: 'A neutral solution has a pH value exactly equal to 7.',
        difficulty: 'easy',
        subject: subjects['Science']._id,
        chapter: scienceChaps[1]._id // Acids Bases Salts
      },
      {
        questionText: 'Which organ is responsible for blood filtration in human beings? / मनुष्य में रक्त छानने के लिए कौन सा अंग जिम्मेदार है?',
        options: ['Lungs', 'Kidneys (वृक्क)', 'Heart', 'Liver'],
        correctOption: 1,
        explanation: 'Kidneys filter waste products out of blood to produce urine.',
        difficulty: 'medium',
        subject: subjects['Science']._id,
        chapter: scienceChaps[2]._id // Life Processes
      },
      {
        questionText: 'The focal length of a spherical mirror of radius of curvature 20 cm is: / 20 सेमी वक्रता त्रिज्या वाले गोलीय दर्पण की फोकस दूरी क्या होगी?',
        options: ['20 cm', '10 cm', '40 cm', '5 cm'],
        correctOption: 1,
        explanation: 'Focal length (f) = Radius of curvature (R) / 2 = 20 / 2 = 10 cm.',
        difficulty: 'medium',
        subject: subjects['Science']._id,
        chapter: scienceChaps[3]._id // Light
      }
    ];

    const questions = [];
    for (const q of questionsData) {
      const createdQ = await Question.create(q);
      questions.push(createdQ);
    }
    console.log('Questions seeded.');

    // 5. Create Test
    console.log('Seeding Tests...');
    const mathTest = await Test.create({
      title: 'Mathematics Chapter Test - Real Numbers & Trigonometry',
      description: 'Practice test covering Real Numbers and Trigonometric formulas.',
      subject: subjects['Mathematics']._id,
      chapter: mathChaps[0]._id,
      questions: [questions[0]._id, questions[1]._id, questions[3]._id, questions[4]._id],
      duration: 10, // 10 minutes
      totalMarks: 40,
      passingMarks: 50, // 50% needed to pass
      negativeMarking: true,
      negativeMarkValue: 0.25,
      status: 'published',
      type: 'chapter',
      scheduledFor: new Date(Date.now() - 3600000) // 1 hour ago
    });

    const scienceTest = await Test.create({
      title: 'Science Weekly Test - Chemistry & Physics Basics',
      description: 'Practice test covering Chemical Reactions, pH value, and Light Mirror reflection.',
      subject: subjects['Science']._id,
      chapter: scienceChaps[0]._id,
      questions: [questions[5]._id, questions[6]._id, questions[7]._id, questions[8]._id],
      duration: 15,
      totalMarks: 40,
      passingMarks: 40,
      negativeMarking: false,
      status: 'published',
      type: 'weekly',
      scheduledFor: new Date(Date.now() - 7200000)
    });
    console.log('Tests seeded.');

    // 6. Create Mock Results (to populate student progress charts)
    console.log('Seeding Results...');
    await Result.create({
      student: student._id,
      test: mathTest._id,
      answers: [
        { question: questions[0]._id, chosenOption: 0, isCorrect: true, isSkipped: false }, // correct
        { question: questions[1]._id, chosenOption: 2, isCorrect: true, isSkipped: false }, // correct
        { question: questions[3]._id, chosenOption: 1, isCorrect: true, isSkipped: false }, // correct
        { question: questions[4]._id, chosenOption: 0, isCorrect: false, isSkipped: false } // incorrect
      ],
      score: 29.75, // 3 corrects * 10 marks - 1 wrong * 0.25 = 29.75
      percentage: 74.38,
      status: 'passed',
      timeTaken: 340,
      attemptedAt: new Date(Date.now() - 24 * 3600 * 1000) // 1 day ago
    });

    await Result.create({
      student: student._id,
      test: scienceTest._id,
      answers: [
        { question: questions[5]._id, chosenOption: 2, isCorrect: true, isSkipped: false }, // correct
        { question: questions[6]._id, chosenOption: 0, isCorrect: true, isSkipped: false }, // correct
        { question: questions[7]._id, chosenOption: 0, isCorrect: false, isSkipped: false }, // incorrect
        { question: questions[8]._id, chosenOption: null, isCorrect: false, isSkipped: true } // skipped
      ],
      score: 20.0, // 2 corrects * 10 marks = 20
      percentage: 50.0,
      status: 'passed',
      timeTaken: 480,
      attemptedAt: new Date() // today
    });

    // Seed progress cache
    await StudentProgress.create({
      student: student._id,
      subject: subjects['Mathematics']._id,
      testsAttempted: 1,
      averageScore: 74.38,
      strongChapters: [mathChaps[0]._id],
      weakChapters: []
    });

    await StudentProgress.create({
      student: student._id,
      subject: subjects['Science']._id,
      testsAttempted: 1,
      averageScore: 50.0,
      strongChapters: [scienceChaps[0]._id],
      weakChapters: []
    });

    // Create a notification
    await Notification.create({
      title: 'Welcome to Bihar Board Exam Prep!',
      message: 'Practice chapter tests daily to improve your scorecard. Weekly rankings update every Sunday at midnight.',
      user: null
    });

    // Create an Activity Log
    await ActivityLog.create({
      user: student._id,
      action: 'Seeded test results logged',
      ipAddress: '127.0.0.1'
    });

    console.log('Results seeded.');
    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database: ', error);
    process.exit(1);
  }
};

seedDatabase();
