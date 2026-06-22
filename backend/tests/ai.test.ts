import { AIService } from '../src/services/ai.service';
import prisma from '../src/utils/db';

jest.mock('../src/utils/db', () => ({
  __esModule: true,
  default: {
    roomAllocation: {
      findMany: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
    aIAnalytics: {
      create: jest.fn(),
    },
  },
}));

describe('AIService Mathematical Forecasting Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return default insights on empty data', async () => {
    (prisma.roomAllocation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([]);

    const result = await AIService.forecastOccupancy();
    expect(result.insights).toContain('Insufficient data');
  });

  it('should compute linear regression and forecast next months', async () => {
    // 3 rooms, capacity 2 each = 6 total capacity
    (prisma.room.findMany as jest.Mock).mockResolvedValue([
      { id: '1', capacity: 2 },
      { id: '2', capacity: 2 },
      { id: '3', capacity: 2 },
    ]);

    // Mock allocations spanning 3 months
    const date1 = new Date();
    date1.setMonth(date1.getMonth() - 2); // 2 months ago
    const date2 = new Date();
    date2.setMonth(date2.getMonth() - 1); // 1 month ago
    const date3 = new Date(); // now

    (prisma.roomAllocation.findMany as jest.Mock).mockResolvedValue([
      { id: 'a1', allocatedAt: date1, vacatedAt: null },
      { id: 'a2', allocatedAt: date2, vacatedAt: null },
      { id: 'a3', allocatedAt: date3, vacatedAt: null },
    ]);

    const result = await AIService.forecastOccupancy();
    expect(result).toHaveProperty('historical');
    expect(result).toHaveProperty('forecast');
    expect(result.forecast.length).toBe(6); // 6 projected months
    expect(result.insights).toBeDefined();
  });
});
