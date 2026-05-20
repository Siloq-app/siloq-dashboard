import { NextRequest, NextResponse } from 'next/server';

// Mock authentication service for development/testing
// This provides realistic responses when the real backend is not available

const MOCK_USERS = [
  {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    token: 'mock-jwt-token-12345',
  },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ message: 'Mock authentication is disabled' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock login logic
    if (email === 'test@example.com' && password === 'password') {
      const user = MOCK_USERS[0];
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token: user.token,
        message: 'Login successful',
      });
    }

    // Mock registration logic
    if (name && email && password) {
      const newUser = {
        id: Date.now(),
        email,
        name,
        token: `mock-jwt-token-${Date.now()}`,
      };
      
      return NextResponse.json({
        user: newUser,
        token: newUser.token,
        message: 'Registration successful',
      });
    }

    // Invalid credentials
    return NextResponse.json(
      {
        error: 'Invalid credentials',
        message: 'Please check your email and password',
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Mock Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Mock authentication failed',
        message: 'An error occurred during authentication',
      },
      { status: 500 }
    );
  }
}
