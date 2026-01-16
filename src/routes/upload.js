const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Check if S3 is configured
const isS3Configured = process.env.AWS_ACCESS_KEY_ID &&
                       process.env.AWS_SECRET_ACCESS_KEY &&
                       process.env.AWS_S3_BUCKET;

// S3 client for delete operations
let s3Client;
if (isS3Configured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// Helper function to get the URL from uploaded file
function getFileUrl(file) {
  if (isS3Configured && file.location) {
    // S3 upload - return the full S3 URL
    return file.location;
  } else {
    // Local upload - return the local path
    return `/uploads/${file.filename}`;
  }
}

// @route   POST /api/upload
// @desc    Upload a single image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = getFileUrl(req.file);

    res.json({
      message: 'Image uploaded successfully',
      url: imageUrl,
      filename: req.file.filename || req.file.key,
      originalName: req.file.originalname,
      size: req.file.size,
      storage: isS3Configured ? 's3' : 'local',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map((file) => ({
      url: getFileUrl(file),
      filename: file.filename || file.key,
      originalName: file.originalname,
      size: file.size,
    }));

    res.json({
      message: 'Images uploaded successfully',
      files: uploadedFiles,
      storage: isS3Configured ? 's3' : 'local',
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete an uploaded image
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    if (isS3Configured) {
      // Delete from S3
      const key = filename.startsWith('uploads/') ? filename : `uploads/${filename}`;
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      res.json({ message: 'File deleted successfully from S3' });
    } else {
      // Delete from local storage
      const filePath = path.join(__dirname, '../../uploads', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
