const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  let host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
  let port = parseInt(process.env.EMAIL_PORT) || 2525;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP credentials missing. Please define EMAIL_USER and EMAIL_PASS environment variables.');
    }
    console.warn(`[Mailer Warning] SMTP auth credentials (EMAIL_USER / EMAIL_PASS) not defined in environment. Simulating email send.`);
    return { success: true, simulated: true };
  }

  // Detect Gmail app password and configure via built-in Gmail service configuration
  const isGmail = user.toLowerCase().includes('gmail.com');
  let transporter;

  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  } else {
    const isSecure = port === 465;
    transporter = nodemailer.createTransport({
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
  }

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
    const targetHost = isGmail ? 'smtp.gmail.com' : host;
    const targetPort = isGmail ? 465 : port;
    console.error(`[Mailer Error] SMTP connection failed on ${targetHost}:${targetPort} -`, error.message);
    throw error; // Throw error so the API reports SMTP failure explicitly
  }
};

module.exports = sendEmail;
