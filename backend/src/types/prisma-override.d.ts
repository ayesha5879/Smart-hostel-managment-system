import '@prisma/client';

declare module '@prisma/client' {
  export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    HOSTEL_MANAGER = "HOSTEL_MANAGER",
    WARDEN = "WARDEN",
    STUDENT = "STUDENT"
  }

  export enum RoomType {
    SINGLE = "SINGLE",
    DOUBLE = "DOUBLE",
    TRIPLE = "TRIPLE",
    DORMITORY = "DORMITORY"
  }

  export enum StudentStatus {
    ACTIVE = "ACTIVE",
    VACATED = "VACATED"
  }

  export enum FeeStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
  }

  export enum PaymentStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
  }

  export enum PaymentMethod {
    CARD = "CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    CASH = "CASH",
    ONLINE = "ONLINE"
  }

  export enum ComplaintCategory {
    ELECTRICITY = "ELECTRICITY",
    WATER = "WATER",
    INTERNET = "INTERNET",
    FURNITURE = "FURNITURE",
    CLEANLINESS = "CLEANLINESS",
    SECURITY = "SECURITY",
    OTHER = "OTHER"
  }

  export enum ComplaintPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
  }

  export enum ComplaintStatus {
    SUBMITTED = "SUBMITTED",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
  }

  export enum VisitorStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CHECKED_IN = "CHECKED_IN",
    CHECKED_OUT = "CHECKED_OUT"
  }

  export enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE"
  }

  export enum NotificationType {
    FEE = "FEE",
    COMPLAINT = "COMPLAINT",
    VISITOR = "VISITOR",
    ROOM = "ROOM",
    ATTENDANCE = "ATTENDANCE",
    GENERAL = "GENERAL"
  }

  export enum AIMetricType {
    OCCUPANCY_FORECAST = "OCCUPANCY_FORECAST",
    COMPLAINT_TRENDS = "COMPLAINT_TRENDS",
    PAYMENT_RISK = "PAYMENT_RISK",
    ATTENDANCE_RISK = "ATTENDANCE_RISK"
  }
}
