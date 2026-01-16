const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error.message);
    return false;
  }
}

// Send email
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: `"The Solo Akash" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Send welcome email for newsletter subscription
async function sendWelcomeEmail(email) {
  const subject = 'Welcome to The Solo Akash';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Georgia, serif; line-height: 1.8; color: #3f3f46; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #18181b; font-size: 28px; margin: 0; }
        .content { margin-bottom: 30px; }
        .footer { text-align: center; color: #71717a; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>The Solo Akash</h1>
          <p style="color: #7c6a5c; font-style: italic;">wandering through words</p>
        </div>
        <div class="content">
          <p>Hello there,</p>
          <p>Thank you for joining my little corner of the internet. You've subscribed to receive stories and photographs from my wanderings - quiet musings on places, poetry, and the everyday moments that often go unnoticed.</p>
          <p>Expect occasional letters with new writings, behind-the-scenes glimpses of journeys, and perhaps a photograph or two that captures a fleeting moment.</p>
          <p>Until the next story,</p>
          <p style="font-style: italic;">Akash</p>
        </div>
        <div class="footer">
          <p>You're receiving this because you subscribed at thesoloakash.com</p>
          <p>If this wasn't you, simply ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
    Welcome to The Solo Akash

    Hello there,

    Thank you for joining my little corner of the internet. You've subscribed to receive stories and photographs from my wanderings.

    Until the next story,
    Akash
  `;

  return sendEmail({ to: email, subject, text, html });
}

module.exports = {
  verifyConnection,
  sendEmail,
  sendWelcomeEmail,
};
