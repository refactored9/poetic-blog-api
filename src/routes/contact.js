const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// Create email transporter (configure with your email service)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// @route   POST /api/contact
// @desc    Submit a contact form message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Please fill in all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    // Save message to database
    const contact = new Contact({
      name,
      email,
      subject,
      message,
    });

    await contact.save();

    // Try to send email notification
    const transporter = createTransporter();
    if (transporter && process.env.SMTP_FROM) {
      try {
        // Send notification to site owner
        await transporter.sendMail({
          from: `"The Solo Akash" <${process.env.SMTP_FROM}>`,
          to: process.env.SMTP_FROM,
          subject: `New Contact Form: ${subject}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">
                New Message from ${name}
              </h2>
              <p style="color: #71717a; font-size: 14px;">
                <strong>From:</strong> ${name} (${email})<br>
                <strong>Subject:</strong> ${subject}
              </p>
              <div style="background: #f7f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #3f3f46; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px;">
                This message was sent via The Solo Akash contact form.
              </p>
            </div>
          `,
        });

        // Send confirmation to sender
        await transporter.sendMail({
          from: `"The Solo Akash" <${process.env.SMTP_FROM}>`,
          to: email,
          subject: 'Thank you for reaching out',
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">
                Thank you, ${name}
              </h2>
              <p style="color: #3f3f46; line-height: 1.7;">
                Your message has found its way to me, and I appreciate you taking the time to write.
              </p>
              <p style="color: #3f3f46; line-height: 1.7;">
                I shall read your words carefully and respond as soon as time permits.
                In the meantime, feel free to explore my writings and journeys.
              </p>
              <div style="background: #f7f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #71717a; font-size: 14px; font-style: italic;">
                  "Not all those who wander are lost."<br>
                  <span style="font-size: 12px;">— J.R.R. Tolkien</span>
                </p>
              </div>
              <p style="color: #3f3f46; line-height: 1.7;">
                Warm regards,<br>
                <em>The Solo Akash</em>
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
              <p style="color: #a1a1aa; font-size: 12px;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Email notification failed:', emailError.message);
      }
    }

    res.status(201).json({
      message: 'Message received successfully',
      id: contact._id,
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages (for admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const messages = await Contact.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact message
router.get('/:id', async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Mark as read if unread
    if (message.status === 'unread') {
      message.status = 'read';
      await message.save();
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/contact/:id
// @desc    Update contact message status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (status) {
      message.status = status;
      if (status === 'replied') {
        message.repliedAt = new Date();
      }
    }

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/contact/:id/reply
// @desc    Send reply to a contact message
router.post('/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ message: 'Email not configured' });
    }

    // Send reply email
    await transporter.sendMail({
      from: `"The Solo Akash" <${process.env.SMTP_FROM}>`,
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">
            Hello ${message.name}
          </h2>
          <div style="color: #3f3f46; line-height: 1.8; white-space: pre-wrap;">
            ${reply}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
            <p style="color: #3f3f46; line-height: 1.7;">
              Warm regards,<br>
              <em>Akash</em><br>
              <span style="color: #71717a; font-size: 14px;">The Solo Akash</span>
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
          <p style="color: #a1a1aa; font-size: 12px;">
            This is a reply to your message: "${message.subject}"
          </p>
        </div>
      `,
    });

    // Update message status
    message.status = 'replied';
    message.repliedAt = new Date();
    await message.save();

    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete a contact message
router.delete('/:id', async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
