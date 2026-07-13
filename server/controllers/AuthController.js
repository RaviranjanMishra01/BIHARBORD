const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const crypto = require('crypto');
const Otp = require('../models/Otp');
const OtpRequestLimit = require('../models/OtpRequestLimit');
const sendEmail = require('../utils/sendEmail');
const parseUserAgent = require('../utils/parseUserAgent');
const getLocation = require('../utils/getLocation');

// Send Verification OTP
const sendOTP = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: 'Please provide email and purpose' });
    }

    const validPurposes = ['register', 'reset_password'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check database state based on purpose first
    const user = await User.findOne({ email: normalizedEmail });
    if (purpose === 'register' && user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (purpose === 'reset_password' && !user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email' });
    }

    // OTP Rate Limiter Check (10 OTPs per day, 60s cooldown timer)
    const limitRecord = await OtpRequestLimit.findOne({ email: normalizedEmail });
    const now = new Date();
    
    if (limitRecord) {
      const timeDiff = now - new Date(limitRecord.lastRequestAt);
      
      // 1. Cooldown timer check (60s)
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another OTP.`
        });
      }

      // 2. Daily limits check (10 requests in production, 100 in development/test)
      const maxDailyRequests = process.env.NODE_ENV === 'production' ? 10 : 100;
      if (limitRecord.count >= maxDailyRequests) {
        return res.status(429).json({
          success: false,
          message: `Daily limit of ${maxDailyRequests} OTP requests reached. Please try again tomorrow.`
        });
      }

      // Increment count and update timestamp
      limitRecord.count += 1;
      limitRecord.lastRequestAt = now;
      await limitRecord.save();
    } else {
      // First request tracking
      await OtpRequestLimit.create({
        email: normalizedEmail,
        count: 1,
        lastRequestAt: now
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store compound OTP in database (overwrites existing codes for this purpose)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Design Beautiful HTML Email Template based on Purpose
    let mailSubject = '';
    let mailHtml = '';

    if (purpose === 'register') {
      mailSubject = 'Verify Your Email Address - Bihar Board Portal';
      mailHtml = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BSEB Matric Exam Portal</h1>
            <p style="margin: 4px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Bihar School Examination Board Prep Hub</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px;">
            <h2 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 18px; font-weight: 700;">Email Verification Required</h2>
            <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              Thank you for registering on the Bihar Board Matric Exam preparation portal. Use the verification code below to complete your email verification:
            </p>
            
            <!-- OTP Code Banner -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification Code</span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #1e3a8a; letter-spacing: 6px;">${otp}</span>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
                ⚠️ <strong>Security Note:</strong> This code is valid for <strong>5 minutes</strong>. If you did not sign up for an account, you can safely ignore this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              &copy; 2026 Bihar Board Matric Exam Portal. All rights reserved.<br>
              Patna, Bihar, India.
            </p>
          </div>
        </div>
      `;
    } else {
      mailSubject = 'Reset Your Password - Bihar Board Portal';
      mailHtml = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #312e81 0%, #4338ca 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BSEB Matric Exam Portal</h1>
            <p style="margin: 4px 0 0 0; color: #c7d2fe; font-size: 13px; font-weight: 500;">Bihar School Examination Board Prep Hub</p>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 32px;">
            <h2 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 18px; font-weight: 700;">Password Recovery</h2>
            <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password. Use the verification OTP below to complete the recovery process:
            </p>
            
            <!-- OTP Code Banner -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Recovery Code</span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #312e81; letter-spacing: 6px;">${otp}</span>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
                ⚠️ <strong>Security Note:</strong> This code is valid for <strong>5 minutes</strong>. If you did not request a password change, please update your account credentials immediately.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              &copy; 2026 Bihar Board Matric Exam Portal. All rights reserved.<br>
              Patna, Bihar, India.
            </p>
          </div>
        </div>
      `;
    }

    // Send email code with explicit error catcher
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: mailSubject,
        text: `Your verification code is: ${otp}. This code is valid for 5 minutes.`,
        html: mailHtml
      });
    } catch (mailError) {
      return res.status(500).json({
        success: false,
        message: `SMTP dispatch failed. Verify EMAIL_USER and EMAIL_PASS in your server .env file. Error: ${mailError.message}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your email successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Register Student
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      rollNumber,
      schoolName,
      district,
      block,
      section,
      mobileNumber,
      parentName,
      parentMobile,
      otp
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate OTP first
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp, purpose: 'register' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired registration OTP' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const student = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role: 'student',
      rollNumber,
      schoolName,
      district,
      block,
      section,
      mobileNumber,
      parentName,
      parentMobile
    });

    const accessToken = generateAccessToken(student._id);
    const refreshToken = generateRefreshToken(student._id);

    student.refreshToken = refreshToken;
    student.lastActiveDate = new Date();
    await student.save();

    // Consume the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Send a beautifully styled Welcome / Success Email
    const welcomeHtml = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.05); border: 1px solid #e2e8f0;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BSEB Matric Exam Portal</h1>
          <p style="margin: 4px 0 0 0; color: #d1fae5; font-size: 13px; font-weight: 500;">Bihar School Examination Board Prep Hub</p>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 40px 32px;">
          <h2 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 20px; font-weight: 700;">🎉 Registration Successful!</h2>
          <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            Hello <strong>${fullName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            Welcome to the Bihar Board Matric Exam preparation portal. Your account has been registered successfully! You can now log in, take practices, track daily streaks, and review your performance.
          </p>
          
          <!-- Registration Details Card -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 28px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Your Profile Details</h3>
            <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: 600; width: 110px; color: #64748b;">Email:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${normalizedEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #64748b;">School Name:</td>
                <td style="padding: 6px 0; color: #0f172a;">${schoolName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #64748b;">District:</td>
                <td style="padding: 6px 0; color: #0f172a;">${district || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center;">
            <a href="https://biharbord.vercel.app/login" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all 0.2s;">Log In to Your Dashboard</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            &copy; 2026 Bihar Board Matric Exam Portal. All rights reserved.<br>
            Patna, Bihar, India.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to Bihar Board Matric Prep Portal!',
        text: `Hello ${fullName}, welcome to the Bihar Board Matric Prep platform! Your account is active.`,
        html: welcomeHtml
      });
    } catch (e) {
      console.warn('[Welcome Mailer Warning] Failed to deliver registration welcome email:', e.message);
    }

    // Resolve real IP and geolocation
    const rawIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const geo = await getLocation(rawIp);

    // Log Activity
    await ActivityLog.create({
      user: student._id,
      action: 'Account registered',
      ipAddress: geo.ip,
      device: parseUserAgent(req.headers['user-agent']),
      location: geo.location
    });

    student.password = undefined;
    student.refreshToken = undefined;

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      accessToken,
      refreshToken,
      user: student
    });
  } catch (error) {
    next(error);
  }
};

// Login Direct (No OTP verification)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account is suspended' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Directly login and issue JWT session tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastActiveDate = new Date();

    // Student streak updates
    if (user.role === 'student') {
      const today = new Date().toDateString();
      if (user.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastActive === yesterday) {
          user.streak += 1;
        } else if (lastActive !== today) {
          user.streak = 1;
        }
      } else {
        user.streak = 1;
      }
    }

    await user.save();

    // Parse Device details
    const device = parseUserAgent(req.headers['user-agent']);
    
    // Resolve client's actual public IP and location
    const rawIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const geo = await getLocation(rawIp);

    // Save login activity log
    await ActivityLog.create({
      user: user._id,
      action: `Logged in (${user.role})`,
      ipAddress: geo.ip,
      device,
      location: geo.location,
      timestamp: new Date()
    });

    user.password = undefined;
    user.refreshToken = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Login Stage 2 (Maintained as fallback, directly succeeds)
const verifyLoginOTP = async (req, res, next) => {
  return login(req, res, next);
};

// Refresh Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(410).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user._id);
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = '';
      await user.save();

      // Find last Logged in record and update logout timestamp
      const lastLog = await ActivityLog.findOne({
        user: user._id,
        action: { $regex: /Logged in/i }
      }).sort({ timestamp: -1 });

      if (lastLog) {
        lastLog.logoutAt = new Date();
        await lastLog.save();
      }
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Forgot Password OTP Trigger
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }

    // OTP Rate Limiter Check for password resets
    const limitRecord = await OtpRequestLimit.findOne({ email: normalizedEmail });
    const now = new Date();
    
    if (limitRecord) {
      const timeDiff = now - new Date(limitRecord.lastRequestAt);
      
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a recovery code.`
        });
      }

      const maxDailyRequests = process.env.NODE_ENV === 'production' ? 10 : 100;
      if (limitRecord.count >= maxDailyRequests) {
        return res.status(429).json({
          success: false,
          message: `Daily limit of ${maxDailyRequests} OTP requests reached. Please try again tomorrow.`
        });
      }

      limitRecord.count += 1;
      limitRecord.lastRequestAt = now;
      await limitRecord.save();
    } else {
      await OtpRequestLimit.create({
        email: normalizedEmail,
        count: 1,
        lastRequestAt: now
      });
    }

    // Generate 6-digit OTP code for password resets
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'reset_password' },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Design Beautiful Recovery Template
    const resetHtml = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 550px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.05); border: 1px solid #e2e8f0;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #312e81 0%, #4338ca 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BSEB Matric Exam Portal</h1>
          <p style="margin: 4px 0 0 0; color: #c7d2fe; font-size: 13px; font-weight: 500;">Bihar School Examination Board Prep Hub</p>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 40px 32px;">
          <h2 style="margin-top: 0; margin-bottom: 16px; color: #0f172a; font-size: 18px; font-weight: 700;">Password Recovery OTP</h2>
          <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Use the verification OTP below to complete the recovery process:
          </p>
          
          <!-- OTP Code Banner -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Reset Code</span>
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #312e81; letter-spacing: 6px;">${otp}</span>
          </div>
          
          <!-- Expiry Notice -->
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px;">
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
              ⚠️ <strong>Security Note:</strong> This code is valid for <strong>5 minutes</strong>. If you did not request a password change, please update your account credentials immediately.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            &copy; 2026 Bihar Board Matric Exam Portal. All rights reserved.<br>
            Patna, Bihar, India.
          </p>
        </div>
      </div>
    `;

    // Send Reset Code with explicit error catcher
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset Your Password - Bihar Board Portal',
        text: `Your password reset OTP code is: ${otp}. This code is valid for 5 minutes.`,
        html: resetHtml
      });
    } catch (mailError) {
      return res.status(500).json({
        success: false,
        message: `SMTP dispatch failed. Verify EMAIL_USER and EMAIL_PASS in your server .env file. Error: ${mailError.message}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with OTP
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP first
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp, purpose: 'reset_password' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP' });
    }

    const student = await User.findOne({ email: normalizedEmail });
    if (!student) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    student.password = newPassword;
    await student.save();

    // Consume the OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can login now.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  register,
  login,
  verifyLoginOTP,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
};
