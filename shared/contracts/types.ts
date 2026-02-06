export interface ApiError {
  code?: string;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  request_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  roles?: string[];
  status?: string;
}

export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserProfile;
}

export interface Question {
  question_id?: string;
  text?: string;
  type?: string;
  choices?: string[];
}

export interface DailyQuizContent {
  content_id?: string;
  title?: string;
  questions?: Question[];
}

export interface DailyReadingContent {
  content_id?: string;
  title?: string;
  passage?: string;
  questions?: Question[];
}

export interface SubmitAnswer {
  question_id: string;
  answer: string;
}

export interface SubmitRequest {
  answers: SubmitAnswer[];
}

export interface SeedGrant {
  seed_type?: string;
  count?: number;
}

export interface SubmitResult {
  score?: number;
  correct_count?: number;
  seed_grant?: SeedGrant;
}

export interface Inventory {
  seeds?: Record<string, number>;
  crops?: Record<string, number>;
  fertilizer?: number;
  updated_at?: string;
}

export interface HarvestCraftRequest {
  seed_type: string;
  use_fertilizer?: boolean;
}

export interface HarvestCraftResult {
  crop_type?: string;
  crop_delta?: number;
  seed_spent?: number;
  fertilizer_spent?: number;
  inventory?: Inventory;
}

export interface LedgerEntry {
  id?: string;
  currency_type?: string;
  item_type?: string;
  delta?: number;
  reason?: string;
  ref_type?: string;
  ref_id?: string;
  created_at?: string;
}

export interface DuelRoomCreateRequest {
  server_id: string;
  room_name: string;
  room_size?: number;
  stake_amount: number;
}

export interface DuelRoomPlayer {
  user_id?: string;
  user_name?: string;
  status?: string;
  is_ready?: boolean;
}

export interface DuelRoom {
  room_id?: string;
  server_id?: string;
  room_name?: string;
  room_size?: number;
  stake_amount?: number;
  status?: string;
  player_count?: number;
  created_by?: string;
  players?: DuelRoomPlayer[];
}

export interface DuelQuestionView {
  question_id?: string;
  order_index?: number;
  question_type?: string;
  category?: string;
  stem?: string;
  passage?: string;
  choices?: { id: string; text: string }[];
  time_limit_sec?: number;
}

export interface DuelMatchResult {
  user_id?: string;
  user_name?: string;
  result?: string;
  rank_position?: number;
  correct_count?: number;
  total_time_ms?: number;
  reward_amount?: number;
}

export interface DuelMatchResultDetail {
  match_id?: string;
  server_id?: string;
  results?: DuelMatchResult[];
  total_escrow?: number;
  system_fee?: number;
}

export interface AssignmentSubmitRequest {
  content: Record<string, unknown>;
}

export interface AssignmentSummary {
  assignment_id?: string;
  title?: string;
  assignment_type?: string;
  due_at?: string;
  status?: string;
}

export interface PostSummary {
  post_id?: string;
  title?: string;
  author_id?: string;
  created_at?: string;
}

export interface PostDetail extends PostSummary {
  content?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  attachment_ids?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  attachment_ids?: string[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface ReportRequest {
  target_type: string;
  target_id: string;
  reason: string;
}

export interface PresignRequest {
  purpose: string;
  filename: string;
  mime: string;
  size: number;
}

export interface WritingSubmitRequest {
  content: string;
  attachment_ids?: string[];
}

export interface Product {
  product_id?: string;
  name?: string;
  price?: number;
  stock?: number;
  status?: string;
}

export interface OrderItem {
  product_id?: string;
  quantity?: number;
  unit_price?: number;
}

export interface Order {
  order_id?: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItemRequest {
  product_id: string;
  quantity: number;
}

export interface OrderCreateRequest {
  items: OrderItemRequest[];
  address: Record<string, unknown>;
}

export interface PaymentCheckoutRequest {
  amount: number;
  order_id?: string;
  subscription?: boolean;
  method: string;
}

export interface Payment {
  payment_id?: string;
  payment_type?: string;
  amount?: number;
  status?: string;
  created_at?: string;
}

export interface AdminOrgCreateRequest {
  name: string;
  plan?: string;
  seat_limit?: number;
  status?: string;
}

export interface AdminOrgUpdateRequest {
  name?: string;
  plan?: string;
  seat_limit?: number;
  status?: string;
}

export interface AdminOrgAdminCreateRequest {
  email: string;
  name?: string;
}

export interface AdminStudentCreateRequest {
  email: string;
  name?: string;
  org_id: string;
  class_ids?: string[];
}

export interface AdminStudentUpdateRequest {
  name?: string;
  status?: string;
  org_id?: string;
  class_ids?: string[];
}

export interface AdminClassCreateRequest {
  org_id: string;
  name: string;
  level_id?: string;
  grade?: string;
  status?: string;
  start_at?: string;
}

export interface AdminClassUpdateRequest {
  name?: string;
  level_id?: string;
  grade?: string;
  status?: string;
  start_at?: string;
}

export interface AdminClassStudentsRequest {
  user_ids: string[];
}

export interface AdminContentImportRequest {
  content_type: string;
  level_id?: string;
  chapter_id?: string;
  schema_version: string;
  content: Record<string, unknown>;
}

export interface AdminAssignmentCreateRequest {
  assignment_type: string;
  title: string;
  payload: Record<string, unknown>;
  due_at?: string;
  targets?: Record<string, unknown>[];
}

export interface AdminAssignmentUpdateRequest {
  title?: string;
  payload?: Record<string, unknown>;
  due_at?: string;
  status?: string;
}

export interface AdminWritingFeedbackRequest {
  rubric: Record<string, unknown>;
  comment?: string;
}

export interface AdminTestCreateRequest {
  org_id: string;
  title: string;
  pdf_file_id: string;
}

export interface AdminTestAnswersRequest {
  answers: Record<string, unknown>;
}

export interface AdminDuelSeasonRequest {
  level_id: string;
  name: string;
  start_at: string;
  end_at: string;
}

export interface AdminDuelSnapshotRequest {
  season_id: string;
  level_id?: string;
}

export interface AdminFlagUpdateRequest {
  enabled?: boolean;
  rollout_percent?: number;
  description?: string;
}

export interface AdminProductRequest {
  name: string;
  price: number;
  stock?: number;
  status?: string;
}
