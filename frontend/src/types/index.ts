export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  phone?: string;
  documentId?: string;
  avatar?: string;
  createdAt: string;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  prizeName: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  ticketsSold: number;
  startDate: string;
  endDate: string;
  drawDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'DRAWN' | 'CANCELLED' | 'COMPLETED';
  imageUrl?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  raffleId: string;
  ticketNumber: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'CANCELLED';
  userId?: string;
  reservationExpiresAt?: string;
  pricePaid?: number;
  purchasedAt?: string;
}

export interface SanGroup {
  id: string;
  name: string;
  description?: string;
  totalMembers: number;
  contributionAmount: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  startDate: string;
  endDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  currentRound: number;
  totalRounds: number;
  lateFeePercentage: number;
  gracePeriodDays: number;
}

export interface SanMember {
  id: string;
  sanGroupId: string;
  userId: string;
  turnNumber: number;
  status: 'ACTIVE' | 'PENDING' | 'LATE' | 'DEFAULTED' | 'REMOVED';
  joinedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';
  method: string;
  providerRef?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'FEE' | 'COMMISSION' | 'BONUS';
  amount: number;
  balanceAfter: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
