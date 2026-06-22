import prisma from '../utils/db';

export class AIService {
  /**
   * Run linear regression on historical occupancy to forecast next 6 months.
   * x = months (1..N), y = count of active allocations.
   */
  static async forecastOccupancy(): Promise<any> {
    const allocations = await prisma.roomAllocation.findMany({
      orderBy: { allocatedAt: 'asc' },
    });

    const totalRooms = await prisma.room.findMany();
    const totalCapacity = totalRooms.reduce((acc, room) => acc + room.capacity, 0);

    if (allocations.length === 0 || totalCapacity === 0) {
      return { forecast: [], insights: "Insufficient data to perform occupancy forecast." };
    }

    // Group allocations by month (YYYY-MM)
    const monthlyDataMap: { [key: string]: number } = {};
    
    // We will establish counts per month
    // For each allocation, it contributes from allocatedAt to (vacatedAt or current time)
    const minDate = new Date(allocations[0].allocatedAt);
    const maxDate = new Date();
    
    const monthsArray: string[] = [];
    const temp = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (temp <= maxDate) {
      const label = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}`;
      monthsArray.push(label);
      monthlyDataMap[label] = 0;
      temp.setMonth(temp.getMonth() + 1);
    }

    // Populate actual active occupancy count per month
    for (const alloc of allocations) {
      const allocStart = new Date(alloc.allocatedAt);
      const allocEnd = alloc.vacatedAt ? new Date(alloc.vacatedAt) : new Date();

      for (const m of monthsArray) {
        const [year, month] = m.split('-').map(Number);
        const currentMonthDate = new Date(year, month - 1, 1);
        if (currentMonthDate >= new Date(allocStart.getFullYear(), allocStart.getMonth(), 1) &&
            currentMonthDate <= new Date(allocEnd.getFullYear(), allocEnd.getMonth(), 1)) {
          monthlyDataMap[m]++;
        }
      }
    }

    // Linear Regression
    const xValues = Array.from({ length: monthsArray.length }, (_, i) => i + 1);
    const yValues = monthsArray.map(m => monthlyDataMap[m]);

    const N = xValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < N; i++) {
      sumX += xValues[i];
      sumY += yValues[i];
      sumXY += xValues[i] * yValues[i];
      sumXX += xValues[i] * xValues[i];
    }

    const meanX = sumX / N;
    const meanY = sumY / N;

    // Slope (m) and Intercept (c)
    let slope = 0;
    let intercept = meanY;
    
    if (N > 1) {
      const num = sumXY - N * meanX * meanY;
      const den = sumXX - N * meanX * meanX;
      slope = den !== 0 ? num / den : 0;
      intercept = meanY - slope * meanX;
    }

    // Project next 6 months
    const historical = monthsArray.map((m, idx) => ({
      month: m,
      actual: yValues[idx],
      predicted: Math.min(totalCapacity, Math.max(0, Math.round(slope * (idx + 1) + intercept))),
      capacity: totalCapacity,
    }));

    const forecast = [];
    const lastMonthDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    for (let i = 1; i <= 6; i++) {
      const futDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + i, 1);
      const label = `${futDate.getFullYear()}-${String(futDate.getMonth() + 1).padStart(2, '0')}`;
      const xVal = N + i;
      const predictedVal = Math.min(totalCapacity, Math.max(0, Math.round(slope * xVal + intercept)));
      forecast.push({
        month: label,
        actual: null,
        predicted: predictedVal,
        capacity: totalCapacity,
      });
    }

    const currentOccupancyRate = totalCapacity > 0 ? (yValues[N - 1] / totalCapacity) * 100 : 0;
    const predictedOccupancyRate = totalCapacity > 0 ? (forecast[5].predicted / totalCapacity) * 100 : 0;
    const changeRate = predictedOccupancyRate - currentOccupancyRate;
    
    let insights = `Current occupancy is at ${currentOccupancyRate.toFixed(1)}%. `;
    if (changeRate > 5) {
      insights += `AI forecasts an upward demand trend, expecting occupancy to reach ${predictedOccupancyRate.toFixed(1)}% (+${changeRate.toFixed(1)}%) in 6 months. Consider opening new wings or optimizing room distributions.`;
    } else if (changeRate < -5) {
      insights += `AI forecasts a downward trend, dropping to ${predictedOccupancyRate.toFixed(1)}% (${changeRate.toFixed(1)}%) in 6 months. Recommended to run maintenance or marketing promotions.`;
    } else {
      insights += `Occupancy is stable, expected to stay around ${predictedOccupancyRate.toFixed(1)}% for the next 6 months. Plan operational budgets accordingly.`;
    }

    // Save/cache analysis in DB
    await prisma.aIAnalytics.create({
      data: {
        metricType: 'OCCUPANCY_FORECAST',
        forecastData: JSON.stringify({ historical, forecast }),
        insights,
        confidenceScore: 0.85,
      }
    });

    return { historical, forecast, insights };
  }

  /**
   * Analyze complaint categories and identify major rising problem areas.
   */
  static async analyzeComplaints(): Promise<any> {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'asc' }
    });

    if (complaints.length === 0) {
      return { insights: "No complaints found to analyze trends.", statistics: [] };
    }

    const categories = ['ELECTRICITY', 'WATER', 'INTERNET', 'FURNITURE', 'CLEANLINESS', 'SECURITY', 'OTHER'];
    const totalComplaints = complaints.length;

    // Count complaints per category
    const categoryCounts: { [key: string]: number } = {};
    categories.forEach(cat => categoryCounts[cat] = 0);
    complaints.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    // Average resolution time (in hours)
    const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, c) => {
        const diff = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
        return acc + diff / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = totalHours / resolvedComplaints.length;
    }

    // Determine trends (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentComplaints = complaints.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
    const priorComplaints = complaints.filter(c => new Date(c.createdAt) >= sixtyDaysAgo && new Date(c.createdAt) < thirtyDaysAgo);

    const recentCatCounts: { [key: string]: number } = {};
    const priorCatCounts: { [key: string]: number } = {};
    categories.forEach(cat => {
      recentCatCounts[cat] = recentComplaints.filter(c => c.category === cat).length;
      priorCatCounts[cat] = priorComplaints.filter(c => c.category === cat).length;
    });

    let primaryIssue = "";
    let maxIncrease = -1;
    categories.forEach(cat => {
      const change = recentCatCounts[cat] - priorCatCounts[cat];
      if (change > maxIncrease) {
        maxIncrease = change;
        primaryIssue = cat;
      }
    });

    let insights = `Average complaint resolution time is ${avgResolutionHours.toFixed(1)} hours. `;
    if (maxIncrease > 0) {
      insights += `${primaryIssue.toLowerCase()} complaints saw the highest surge of +${maxIncrease} requests compared to last month. Maintenance should prioritize checking ${primaryIssue.toLowerCase()} infrastructure.`;
    } else {
      insights += `All complaint categories are stable or declining. Good job on infrastructure maintenance!`;
    }

    const statistics = categories.map(cat => ({
      category: cat,
      count: categoryCounts[cat],
      percentage: totalComplaints > 0 ? (categoryCounts[cat] / totalComplaints) * 100 : 0,
      recent: recentCatCounts[cat],
      prior: priorCatCounts[cat],
    }));

    await prisma.aIAnalytics.create({
      data: {
        metricType: 'COMPLAINT_TRENDS',
        forecastData: JSON.stringify({ statistics, avgResolutionHours }),
        insights,
        confidenceScore: 0.90,
      }
    });

    return { statistics, avgResolutionHours, insights };
  }

  /**
   * Risk engine scoring students for late fees based on their historical ledger.
   */
  static async predictLatePayments(): Promise<any> {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        fees: {
          include: { payments: true }
        }
      }
    });

    const risks = students.map(student => {
      let totalFees = student.fees.length;
      let latePayments = 0;
      let pendingOverdue = 0;

      student.fees.forEach(f => {
        if (f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date() > new Date(f.dueDate))) {
          pendingOverdue++;
        }
        
        const pay = f.payments.find(p => p.status === 'SUCCESS');
        if (pay && new Date(pay.paymentDate) > new Date(f.dueDate)) {
          latePayments++;
        }
      });

      // Simple heuristic risk scoring
      // base risk starts at 10%. If they have 1 late payment: +30%. If they have pending overdue: +50%.
      let score = 10;
      if (totalFees > 0) {
        score += (latePayments / totalFees) * 40;
      }
      if (pendingOverdue > 0) {
        score += Math.min(50, pendingOverdue * 25);
      }
      
      score = Math.min(100, score);
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (score > 70) riskLevel = 'HIGH';
      else if (score > 40) riskLevel = 'MEDIUM';

      return {
        studentId: student.id,
        name: student.user.name,
        rollNumber: student.studentId,
        score: Math.round(score),
        riskLevel,
        pendingOverdue,
        pastLateCount: latePayments,
      };
    });

    // High risk count
    const highRiskStudents = risks.filter(r => r.riskLevel === 'HIGH');
    const insights = `${highRiskStudents.length} students identified at HIGH risk of payment delinquency. Recommended to send automated SMS notifications and set payment plans for them before the next cycle.`;

    await prisma.aIAnalytics.create({
      data: {
        metricType: 'PAYMENT_RISK',
        forecastData: JSON.stringify({ risks }),
        insights,
        confidenceScore: 0.82,
      }
    });

    return { risks, insights };
  }

  /**
   * Identifies students at risk of attendance failure (<75% attendance or consecutive absences).
   */
  static async predictAttendanceRisks(): Promise<any> {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    const risks = students.map(student => {
      const records = student.attendance;
      const total = records.length;
      if (total === 0) {
        return {
          studentId: student.id,
          name: student.user.name,
          rollNumber: student.studentId,
          attendanceRate: 100,
          consecutiveAbsents: 0,
          riskLevel: 'LOW' as const,
          score: 0
        };
      }

      const presents = records.filter(r => r.status === 'PRESENT').length;
      const lates = records.filter(r => r.status === 'LATE').length;
      // Late count counts as 0.75 present
      const attendanceRate = ((presents + lates * 0.75) / total) * 100;

      // Find consecutive absents starting from the most recent
      let consecutiveAbsents = 0;
      for (const rec of records) {
        if (rec.status === 'ABSENT') {
          consecutiveAbsents++;
        } else {
          break;
        }
      }

      // Compute score
      let score = 0;
      if (attendanceRate < 75) {
        score += (75 - attendanceRate) * 1.5; // Up to ~100
      }
      score += consecutiveAbsents * 20;
      score = Math.min(100, score);

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (score > 60 || consecutiveAbsents >= 3) riskLevel = 'HIGH';
      else if (score > 30 || consecutiveAbsents >= 2) riskLevel = 'MEDIUM';

      return {
        studentId: student.id,
        name: student.user.name,
        rollNumber: student.studentId,
        attendanceRate: Math.round(attendanceRate),
        consecutiveAbsents,
        riskLevel,
        score: Math.round(score)
      };
    });

    const highRisks = risks.filter(r => r.riskLevel === 'HIGH');
    const insights = `Found ${highRisks.length} students with attendance below 75% or consecutive recent absences. We recommend checking in with Warden logs to verify health, safety, or academic issues.`;

    await prisma.aIAnalytics.create({
      data: {
        metricType: 'ATTENDANCE_RISK',
        forecastData: JSON.stringify({ risks }),
        insights,
        confidenceScore: 0.88,
      }
    });

    return { risks, insights };
  }
}
