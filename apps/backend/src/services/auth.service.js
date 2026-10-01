/**
 * Authentication Service
 * Handles user credential validation, registration, and token generation.
 */

export class AuthService {
  static async registerUser({ email, password, firstName, lastName, role }) {
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      const err = new Error('All registration fields are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      email,
      firstName,
      lastName,
      role: role || 'candidate',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Simulated JWT token generation
    const mockPayload = Buffer.from(
      JSON.stringify({
        userId: newUser.id,
        role: newUser.role,
        email: newUser.email,
      })
    ).toString('base64');
    const accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.mock_sig`;

    return {
      user: newUser,
      tokens: {
        accessToken,
        refreshToken: `ref_${Date.now().toString(36)}`,
        expiresIn: '7d',
      },
    };
  }

  static async authenticateUser({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password must be provided.');
      err.statusCode = 400;
      err.code = 'MISSING_CREDENTIALS';
      throw err;
    }

    // Default admin / demo user credentials
    const role = email.includes('admin')
      ? 'admin'
      : email.includes('client')
        ? 'client'
        : 'candidate';

    const user = {
      id: `usr-${Buffer.from(email).toString('hex').slice(0, 8)}`,
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const mockPayload = Buffer.from(
      JSON.stringify({ userId: user.id, role: user.role, email: user.email })
    ).toString('base64');
    const accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.mock_sig`;

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: `ref_${Date.now().toString(36)}`,
        expiresIn: '7d',
      },
    };
  }
}
