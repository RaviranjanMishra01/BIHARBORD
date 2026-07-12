const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  let host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
  let port = parseInt(process.env.EMAIL_PORT) || 2525;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log(`\n======================================================`);
  console.log(`[EMAIL OUTBOX] To: ${to}`);
  console.log(`[EMAIL OUTBOX] Subject: ${subject}`);
  console.log(`[EMAIL OUTBOX] Body: ${text}`);
  console.log(`======================================================\n`);

  if (!user || !pass) {
    console.warn(`[Mailer Warning] SMTP auth credentials (EMAIL_USER / EMAIL_PASS) not defined in environment.`);
    return { success: true, simulated: true };
  }

  // Auto-detect Gmail App Password configuration if host is left as mock mailtrap
  if (user.toLowerCase().includes('gmail.com') && host === 'smtp.mailtrap.io') {
    host = 'smtp.gmail.com';
    port = 465;
  }

  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // True for 465, false for 587
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false // Prevents failure on self-signed certificates
    }
  });

  const mailOptions = {
    from: `"Bihar Board Test Portal" <${user}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer Success] Message sent successfully: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Mailer Error] SMTP connection failed on ${host}:${port} -`, error.message);
    throw error; // Throw error so the API reports SMTP failure explicitly
  }
};

module.exports = sendEmail;
