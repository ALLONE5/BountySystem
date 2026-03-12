import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDeveloper } from '../middleware/permission.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { auditFileUpload, auditFileDelete } from '../middleware/audit.middleware.js';
import { sendSuccess } from '../utils/responseHelpers.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../config/logger.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    
    // Ensure upload directory exists
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = `logo_${timestamp}${ext}`;
    cb(null, name);
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Apply authentication and developer permission
router.use(authenticate);
router.use(requireDeveloper);

/**
 * POST /api/upload/logo
 * Upload system logo
 */
router.post('/logo', upload.single('logo'), auditFileUpload, asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  // Generate URL for the uploaded file
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  
  res.status(200).json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      url: logoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
}));

/**
 * DELETE /api/upload/logo/:filename
 * Delete uploaded logo
 */
router.delete('/logo/:filename', auditFileDelete, asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.params;
  
  // Validate filename to prevent path traversal
  if (!filename || filename.includes('..') || filename.includes('/')) {
    throw new ValidationError('Invalid filename');
  }
  
  const filePath = path.join(process.cwd(), 'uploads', 'logos', filename);
  
  try {
    await fs.unlink(filePath);
    
    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new ValidationError('File not found');
    }
    throw error;
  }
}));

/**
 * GET /api/upload/logos
 * List all uploaded logos
 */
router.get('/logos', asyncHandler(async (req: Request, res: Response) => {
  const logoDir = path.join(process.cwd(), 'uploads', 'logos');
  
  try {
    const files = await fs.readdir(logoDir);
    const logoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    const logos = await Promise.all(
      logoFiles.map(async (filename) => {
        const filePath = path.join(logoDir, filename);
        const stats = await fs.stat(filePath);
        
        return {
          filename,
          url: `/uploads/logos/${filename}`,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
    );
    
    sendSuccess(res, logos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, return empty array
      sendSuccess(res, [],
      );
    } else {
      throw error;
    }
  }
}));

export default router;