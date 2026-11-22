// ============================================================
// Tamam Fleet Dashboard — Types
// ============================================================

// ---------- Envelope + pagination ----------

export interface ApiEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[] | null;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ---------- Roles ----------

export type UserRole =
  | "Customer"
  | "Driver"
  | "StoreOwner"
  | "Admin"
  | "Supervisor";

// ---------- Auth ----------

export interface LoginDto {
  phoneNumber: string;
  password: string;
  role: UserRole;
}

export interface SendOtpDto {
  phoneNumber: string;
  role: UserRole;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  code: string;
  role: UserRole;
}

export interface OtpSentResponseDto {
  message: string | null;
  expiresInSeconds: number;
  code: string | null;
}

export interface AuthResponseDto {
  userId: string;
  phoneNumber: string | null;
  fullName: string | null;
  role: string | null;
  token: string | null;
  expiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string;
  isActive: boolean;
}

export interface RefreshTokenDto {
  token: string | null;
  refreshToken: string | null;
}

export interface ChangePasswordDto {
  newPassword: string | null;
}

// ---------- Supervisor profile ----------

export interface SupervisorProfileDto {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  cityId: string | null;
  cityName: string | null;
  areas: AreaSummaryDto[] | null;
  createdAt: string;
}

// ---------- Areas ----------

export interface AreaSummaryDto {
  areaId: string;
  areaName: string | null;
  driverCount: number;
  pendingOrders: number;
  activeOrders: number;
}

// ---------- Dashboard ----------

export interface SupervisorDashboardDto {
  totalDrivers: number;
  onlineDrivers: number;
  pendingOrders: number;
  activeDeliveries: number;
  completedToday: number;
  areas: AreaSummaryDto[] | null;
}

// ============================================================
// Driver Supervision
// ============================================================

export interface DriverSupervisionDto {
  driverId: string;
  fullName: string;
  phoneNumber: string;

  isOnline: boolean;
  isVerified: boolean;

  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  totalDeliveries: number;
  todayDeliveries: number;

  activeOrderId: string | null;
  activeOrderStatus: string | null;
  lastLocationUpdateAt: string | null;

  vehicleType: string | null;
  vehiclePlateNumber: string | null;

  cityId: string | null;
  cityAr: string | null;
  cityEn: string | null;
}

export interface SupervisorDriverFilterDto {
  IsOnline?: boolean;
  IsAvailable?: boolean;
  AreaId?: string;
  Search?: string;
  PageIndex?: number;
  PageSize?: number;
}

export interface SupervisorCreateDriverDto {
  fullName: string;
  phoneNumber: string;
  password: string;

  email?: string | null;
  profilePictureUrl?: string | null;

  vehicleType: string;
  vehiclePlateNumber: string;

  cityId?: string | null;
}

export interface SupervisorUpdateDriverDto {
  fullName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  cityId?: string | null;
}

export type DriverLiveStatus = "on_trip" | "available" | "offline";

export function deriveDriverStatus(
  d: DriverSupervisionDto,
): DriverLiveStatus {
  if (d.activeOrderId) return "on_trip";
  if (d.isOnline) return "available";
  return "offline";
}

// ============================================================
// Orders
// ============================================================

export interface SupervisorOrderDto {
  orderId: string;
  orderNumber: string | null;
  status: string | null;
  storeName: string | null;
  customerName: string | null;
  deliveryAddress: string | null;
  totalAmount: number;
  driverId: string | null;
  driverName: string | null;
  areaId: string | null;
  supervisorId: string | null;
  createdAt: string;
}

export const SUPERVISOR_ORDER_STATUS = {
  Assigned: "Assigned",
  Accepted: "Accepted",
  ArrivedAtStore: "ArrivedAtStore",
  ReadyForPickup: "ReadyForPickup",
  PickedUp: "PickedUp",
  InTransit: "InTransit",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  Failed: "Failed",
} as const;

export type SupervisorOrderStatus =
  (typeof SUPERVISOR_ORDER_STATUS)[keyof typeof SUPERVISOR_ORDER_STATUS];

export interface AssignOrderDto {
  orderId: string;
  driverId: string;
  notes: string | null;
}

export interface ReassignOrderDto {
  driverId: string;
  notes: string | null;
}

// ---------- Query params ----------

export interface SupervisorOrderListQuery {
  Status?: string;
  DriverId?: string;
  AreaId?: string;
  From?: string;
  To?: string;
  PageIndex?: number;
  PageSize?: number;
}

// ============================================================
// Wallet
// ============================================================

export interface WalletSummaryDto {
  walletId: string;
  balance: number;
  totalIn: number;
  totalOut: number;
  currency: string | null;
  minimumWithdrawalAmount: number;
  canRequestWithdrawal: boolean;
  pendingWithdrawalCount: number;
  pendingWithdrawalAmount: number;
  recentTransactions: WalletTransactionDto[] | null;
}

export interface WalletTransactionDto {
  id: string;
  type: string | null;
  amount: number;
  balanceAfter: number;
  description: string | null;
  orderId: string | null;
  orderNumber: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

export interface WithdrawalDto {
  id: string;
  amount: number;
  status: string | null;
  notes: string | null;
  rejectionReason: string | null;
  paymentReference: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface RequestWithdrawalDto {
  amount: number;
}

export interface WalletTransactionListQuery {
  Type?: string;
  OrderId?: string;
  From?: string;
  To?: string;
  PageIndex?: number;
  PageSize?: number;
}

// ============================================================
// Notifications
// ============================================================

export interface NotificationPayloadDto {
  action: string | null;
  targetPage: string | null;
  targetId: string | null;
  extra: Record<string, string> | null;
}

export interface NotificationSummaryDto {
  id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  payload: NotificationPayloadDto;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  recipientId: string;
  recipientType: string | null;
  type: string | null;
  title: string | null;
  body: string | null;
  payload: NotificationPayloadDto;
  isRead: boolean;
  readAt: string | null;
  isSent: boolean;
  sentAt: string | null;
  isDelivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
}

export interface UnreadCountDto {
  total: number;
  byType: Record<string, number> | null;
}

export interface NotificationPreferencesDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  chatMessages: boolean;
  systemAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom: string | null;
  quietHoursTo: string | null;
}

export interface MarkAllAsReadResultDto {
  countMarkedAsRead: number;
  markedAt: string;
}

export interface NotificationListQuery {
  Type?: string;
  IsRead?: boolean;
  From?: string;
  To?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ============================================================
// Files
// ============================================================

export interface FileUploadResultDto {
  url: string | null;
  relativePath: string | null;
  fileName: string | null;
  sizeInBytes: number;
  contentType: string | null;
}

// ============================================================
// Cities
// ============================================================

export interface CityListDto {
  id: string;
  name: string | null;
  isActive: boolean;
}