import mongoose from 'mongoose';
import Candidate from '../models/candidate.mongo.model.js';
import {
  hashPassword,
  comparePassword,
  generateCandidateToken,
  generatePasswordResetToken,
  hashResetToken,
  setAuthCookie,
  clearAuthCookie,
  revokeToken,
} from '../utils/auth.util.js';

// In-memory fallback if MongoDB is offline during local development
const localDevCandidates = new Map();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

export const registerCandidate = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || password.length < 12) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Password must be at least 12 characters long.',
        });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, error: 'Passwords do not match.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existingCandidate = await Candidate.findOne({ email: cleanEmail });
      if (existingCandidate) {
        return res.status(409).json({
          success: false,
          error:
            'An account with this email address already exists. Please log in instead.',
        });
      }
    } else {
      if (localDevCandidates.has(cleanEmail)) {
        return res.status(409).json({
          success: false,
          error:
            'An account with this email address already exists in local storage.',
        });
      }
    }

    const hashedPassword = await hashPassword(password);

    let candidate;
    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : '',
        status: 'Applied',
      });
    } else {
      candidate = {
        _id: 'cand_' + Date.now(),
        id: 'cand_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : '',
        status: 'Applied',
        technicalSkills: [],
        experience: 0,
        createdAt: new Date(),
      };
      localDevCandidates.set(cleanEmail, candidate);
    }

    const token = generateCandidateToken(candidate);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Thinkwires.',
      token,
      candidate: {
        id: candidate._id || candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
      },
    });
  } catch (error) {
    console.error('Candidate registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again.',
    });
  }
};

export const loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let candidate = null;

    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.findOne({ email: cleanEmail }).select(
        '+password'
      );
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: 'Database connection unavailable.',
        });
      }
      candidate = localDevCandidates.get(cleanEmail);
    }

    if (!candidate) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await comparePassword(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const token = generateCandidateToken(candidate);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      candidate: {
        id: candidate._id || candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        currentRole: candidate.currentRole,
        technicalSkills: candidate.technicalSkills || [],
        experience: candidate.experience || 0,
        status: candidate.status,
      },
    });
  } catch (error) {
    console.error('Candidate login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const candidate = req.candidate;
    return res.status(200).json({
      success: true,
      authenticated: true,
      candidate: {
        id: candidate._id || candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || '',
        headline: candidate.headline || '',
        location: candidate.location || '',
        currentRole: candidate.currentRole || 'Software Engineer',
        technicalSkills: candidate.technicalSkills || [],
        experience: candidate.experience || 0,
        expectedSalary: candidate.expectedSalary || 'Market Standard',
        resumeUrl: candidate.resumeUrl || '',
        portfolioUrl: candidate.portfolioUrl || '',
        githubUrl: candidate.githubUrl || '',
        linkedinUrl: candidate.linkedinUrl || '',
        bio: candidate.bio || '',
        status: candidate.status || 'Applied',
        createdAt: candidate.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve candidate profile.',
    });
  }
};

export const logoutCandidate = async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.thinkwires_candidate_jwt) {
      token = req.cookies.thinkwires_candidate_jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      await revokeToken(token);
    }

    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to complete logout.',
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let candidate = null;

    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.findOne({ email: cleanEmail });
    } else {
      candidate = localDevCandidates.get(cleanEmail);
    }

    // Return generic success to mitigate user enumeration attacks
    if (!candidate) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    const { rawToken, hashedToken, expiresAt } = generatePasswordResetToken();

    if (mongoose.connection.readyState === 1) {
      candidate.resetPasswordToken = hashedToken;
      candidate.resetPasswordExpire = expiresAt;
      await candidate.save();
    } else {
      candidate.resetPasswordToken = hashedToken;
      candidate.resetPasswordExpire = expiresAt;
    }

    const responsePayload = {
      success: true,
      message:
        'If an account exists with that email, a password reset link has been dispatched.',
    };

    // Expose reset link in development response for friction-free local verification
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devResetUrl = `/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;
      console.log(
        `[DEV ONLY] Reset Password Link: /reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`
      );
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to process password reset request.',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token, email, and new password are required.',
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 12 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedToken = hashResetToken(token);

    let candidate = null;
    if (mongoose.connection.readyState === 1) {
      candidate = await Candidate.findOne({
        email: cleanEmail,
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    } else {
      const devCand = localDevCandidates.get(cleanEmail);
      if (
        devCand &&
        devCand.resetPasswordToken === hashedToken &&
        devCand.resetPasswordExpire > Date.now()
      ) {
        candidate = devCand;
      }
    }

    if (!candidate) {
      return res.status(400).json({
        success: false,
        error:
          'Password reset token is invalid or has expired. Please request a new one.',
      });
    }

    candidate.password = await hashPassword(password);
    // Invalidate token immediately to prevent replay attacks
    candidate.resetPasswordToken = null;
    candidate.resetPasswordExpire = null;

    if (mongoose.connection.readyState === 1) {
      await candidate.save();
    }

    return res.status(200).json({
      success: true,
      message:
        'Password reset successful! You may now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.',
    });
  }
};
