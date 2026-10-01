/**
 * Authentication Controller
 * Parses HTTP requests for registration, login, and profile fetching.
 */

import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.authenticateUser(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res) {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }

  static async logout(req, res) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session invalidated.',
    });
  }
}
