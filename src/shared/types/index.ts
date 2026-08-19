// ============================================================
// Fleet Supervisor Types
// ============================================================

// ---------- Shared Pagination ----------
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ---------- API Response Wrapper ----------
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}

// ---------- Supervisor Profile ----------
export interface SupervisorProfileDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  joinedDate: string;
  lastLoginDate?: string;
}

export interface UpdateSupervisorProfileDto {
  fullName?: string;
  email?: string;
  isActive?: boolean;
}

// ---------- Driver Management ----------
export type DriverStatus =
  | "available"
  | "on_trip"
  | "off_duty"
  | "on_leave"
  | "suspended";

export interface DriverLocation {
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export interface DriverDto {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  onTimePercentage: number;
  joinedDate: string;
  lastActiveDate?: string;
  currentLocation?: DriverLocation;
}

export interface DriverFilterParams extends PaginationParams {
  status?: DriverStatus;
  search?: string;
}

// ---------- Driver Creation / Update DTOs ----------
export interface SupervisorCreateDriverDto {
  phoneNumber: string;
  fullName: string;
  email?: string;
  password?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
}

export interface UpdateDriverDto {
  fullName?: string;
  email?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
}

// ---------- Order Assignment ----------
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface SupervisorOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  driverId?: string;
  driverName?: string;
  specialInstructions?: string;
  createdAt: string;

  customerAddress?: string;
  storeAddress?: string;
  storeId?: string;
  items?: OrderItemDto[];
}

export interface AssignOrderDto {
  orderId: string;
  driverId: string;
  notes?: string;
}

export interface ReassignOrderDto {
  driverId: string;
  notes?: string;
}

export interface OrderFilterParams extends PaginationParams {
  status?: OrderStatus;
  search?: string;
}

export interface OrderItemDto {
  productName: string;
  quantity: number;
  price: number;
}

// ---------- Driver Requests ----------
export type DriverRequestStatus = "pending" | "approved" | "rejected";

export interface DriverRequestDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  status: DriverRequestStatus;
  createdAt: string;
  city?: string;
  address?: string;
}

export interface DriverRequestFilterParams extends PaginationParams {
  status?: DriverRequestStatus;
}

export interface RejectDriverRequestDto {
  reason: string;
}

// ---------- Supervisor Dashboard ----------
export interface SupervisorDashboardDto {
  totalDrivers: number;
  onlineDrivers: number;
  pendingOrders: number;
  activeDeliveries: number;
  completedToday: number;
  areas?: DashboardAreaDto[];
}

export interface DashboardAreaDto {
  areaId: string;
  areaName: string;
  driverCount: number;
}

// ---------- Supervisor Wallet ----------
export interface SupervisorWalletDto {
  walletBalance: number;
  currency?: string;
}

export interface CreateWithdrawalDto {
  amount: number;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
}

// ---------- Support Tickets ----------
export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string; // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string; // "Low" | "Medium" | "High" | "Urgent"
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessageDto[];
  lastMessage?: SupportMessageDto;
}

// ---------- Support Tickets ----------
export interface SupportMessageDto {
  id: string;
  ticketId: string;
  content: string;
  senderType?: string;
  senderName?: string;
  userType?: string; // "Fleet" | "Support" | "Store" etc.
  userName?: string;
  createdAt: string;
  attachmentUrl?: string;
}

export interface CreateSupportTicketDto {
  subject: string;
  message: string;
  priority: string;
  orderId?: string | null;
}

export interface SendSupportMessageDto {
  ticketId: string;
  content: string;
  attachmentUrl?: string;
}

// ---------- Notifications ----------
export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  dataJson: string | null;
  createdAt: string;
}

export interface NotificationFilterParams extends PaginationParams {
  isRead?: boolean;
}

// ---------- Shared Auth Types ----------
export interface LoginCredentials {
  phoneNumber: string;
  password: string;
  role: number; // UserRole enum from API (0-4)
}

export interface SendOtpCredentials {
  phoneNumber: string;
  role: number;
}

export interface VerifyOtpCredentials {
  phoneNumber: string;
  code: string;
  role: number;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface UpdateLocationDto {
  latitude: number;
  longitude: number;
}
