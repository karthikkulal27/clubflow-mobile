// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  clubId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Club ────────────────────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  monthlyFee: number;
  currency: string;
  createdAt: string;
  _count: { memberships: number };
}

// ─── Members ─────────────────────────────────────────────────────────────────

export interface Member {
  membershipId: string;
  userId: string;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  emergencyContact: string | null;
  role: Role;
  isActive: boolean;
  joinedAt: string;
  profileCompletion: number;
  paymentSummary?: { paidCount: number; pendingCount: number };
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'WAIVED';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  status: PaymentStatus;
  paidAt: string | null;
  razorpayPaymentId?: string | null;
  dueDate?: string | null;
  specialCollectionId?: string | null;
  specialCollection?: { label: string } | null;
  user?: { id: string; name: string; phone: string; avatarUrl: string | null };
}

export interface SpecialCollectionStats {
  total: number;
  paidCount: number;
  pendingCount: number;
  collectedAmount: number;
  pendingAmount: number;
}

export interface SpecialCollection {
  id: string;
  label: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
  dueDate: string;
  createdAt: string;
  stats: SpecialCollectionStats;
}

export interface PaymentStats {
  month: number;
  year: number;
  total: number;
  paidCount: number;
  pendingCount: number;
  collectedAmount: number;
  pendingAmount: number;
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
}

export interface DuesPlanPeriod {
  month: number;
  year: number;
}

export interface DuesPlan {
  id: string;
  label: string | null;
  amount: number;
  currency: string;
  createdAt: string;
  periods: DuesPlanPeriod[];
  paidCount: number;
  pendingCount: number;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
  clubName: string;
  month: number;
  year: number;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string | null;
  receiptUrl: string | null;
  expenseDate: string;
  createdAt: string;
  addedBy: { id: string; name: string };
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type RsvpStatus = 'GOING' | 'NOT_GOING' | 'MAYBE';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  _count?: { rsvps: number };
  myRsvp?: RsvpStatus | null;
  rsvpCounts?: { GOING: number; NOT_GOING: number; MAYBE: number };
}

// ─── Announcements ───────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'PAYMENT_DUE'
  | 'PAYMENT_SUCCESS'
  | 'NEW_ANNOUNCEMENT'
  | 'NEW_EVENT'
  | 'EVENT_REMINDER'
  | 'EXPENSE_ADDED'
  | 'EVENT_RSVP';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface AdminDashboard {
  role: 'ADMIN';
  currentMonth: { month: number; year: number };
  currentDue: {
    id: string;
    amount: number;
    status: PaymentStatus;
    paidAt: string | null;
    currency: string;
    month: number;
    year: number;
  } | null;
  stats: {
    totalMembers: number;
    paidCount: number;
    pendingCount: number;
    totalCollection: number;
    totalExpenses: number;
    availableBalance: number;
  };
  upcomingEvents: Pick<Event, 'id' | 'title' | 'startAt' | 'location'>[];
  recentPayments: (Pick<Payment, 'id' | 'amount' | 'month' | 'year' | 'paidAt'> & {
    user: { id: string; name: string; avatarUrl: string | null };
  })[];
  recentExpenses: Pick<Expense, 'id' | 'title' | 'amount' | 'category' | 'expenseDate'>[];
}

export interface MemberDashboard {
  role: 'MEMBER';
  currentMonth: { month: number; year: number };
  currentDue: {
    id: string;
    amount: number;
    status: PaymentStatus;
    paidAt: string | null;
    currency: string;
    month: number;
    year: number;
  } | null;
  finance: {
    totalCollection: number;
    totalExpenses: number;
    availableBalance: number;
  };
  upcomingEvents: Pick<Event, 'id' | 'title' | 'startAt' | 'location'>[];
  latestAnnouncement: Pick<Announcement, 'id' | 'title' | 'body' | 'publishedAt'> | null;
  myPaymentHistory: Pick<Payment, 'id' | 'amount' | 'month' | 'year' | 'status' | 'paidAt'>[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Member: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  Finance: undefined;
  Events: undefined;
  More: undefined;
};

export type MemberTabParamList = {
  Home: undefined;
  Payments: undefined;
  Finance: undefined;
  Events: undefined;
  More: undefined;
};
