import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/db';

jest.mock('../src/utils/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Auth Endpoints Mocked Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 on missing login parameters', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' });
    
    expect(res.status).toBe(400);
  });

  it('should return error on non-existing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@aegis.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email');
  });
});
