const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Check if S3 is configured
const isS3Configured = process.env.AWS_ACCESS_KEY_ID &&
                       process.env.AWS_SECRET_ACCESS_KEY &&
                       process.env.AWS_S3_BUCKET;

let upload;

if (isS3Configured) {
  // Configure S3 client
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // S3 storage configuration
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const uniqueName = `uploads/${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    },
  });

  console.log('Using S3 storage for uploads');
} else {
  // Fallback to local storage
  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  upload = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    },
  });

  console.log('Using local storage for uploads (S3 not configured)');
}

module.exports = upload;
