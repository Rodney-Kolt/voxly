import { API_URL } from './constants';

interface RequestOptions extends RequestInit {
  data?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, ...fetchOptions } = options;

  const config: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      json?.error?.message || 'An error occurred.',
      json?.error?.code || 'UNKNOWN_ERROR',
      res.status
    );
  }

  return json.data as T;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

// Auth
export const authApi = {
  google: (token: string) =>
    request<{ user: User }>('/api/auth/google', { method: 'POST', data: { token } }),
  me: () => request<{ user: User }>('/api/auth/me'),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
};

// Polls
export const pollsApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    return request<{ polls: PollWithDetails[]; page: number; limit: number }>(
      `/api/polls?${qs.toString()}`
    );
  },
  trending: (params?: { page?: number; limit?: number; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.category) qs.set('category', params.category);
    return request<{ polls: PollWithDetails[]; page: number; limit: number }>(
      `/api/polls/trending?${qs.toString()}`
    );
  },
  get: (id: string) => request<{ poll: PollWithDetails }>(`/api/polls/${id}`),
  create: (data: CreatePollData) =>
    request<{ poll: PollWithDetails }>('/api/polls', { method: 'POST', data }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/polls/${id}`, { method: 'DELETE' }),
  vote: (pollId: string, optionId: string) =>
    request<{ poll: PollWithDetails }>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      data: { optionId },
    }),
  results: (pollId: string) =>
    request<{ poll: PollWithDetails }>(`/api/polls/${pollId}/results`),
};

// Comments
export const commentsApi = {
  list: (pollId: string, params?: { page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    return request<{ comments: Comment[]; total: number }>(
      `/api/polls/${pollId}/comments?${qs.toString()}`
    );
  },
  create: (pollId: string, content: string) =>
    request<{ comment: Comment }>(`/api/polls/${pollId}/comments`, {
      method: 'POST',
      data: { content },
    }),
  delete: (commentId: string) =>
    request<{ message: string }>(`/api/comments/${commentId}`, { method: 'DELETE' }),
};

// Users
export const usersApi = {
  get: (username: string) =>
    request<{ user: UserProfile; polls: UserPollSummary[] }>(`/api/users/${username}`),
  updateMe: (data: UpdateProfileData) =>
    request<{ user: Partial<User> }>('/api/users/me', { method: 'PUT', data }),
  myPolls: (params?: { page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    return request<{ polls: UserPollSummary[] }>(`/api/users/me/polls?${qs.toString()}`);
  },
};

// --- Types ---
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
}

export interface UserProfile extends User {
  pollCount: number;
  votesReceived: number;
}

export interface UserPollSummary {
  id: string;
  question: string;
  category: string;
  createdAt: string;
  voteCount: number;
  commentCount: number;
}

export interface PollOption {
  id: string;
  optionText: string;
  position: number;
  voteCount: number;
}

export interface PollWithDetails {
  id: string;
  question: string;
  category: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  options: PollOption[];
  totalVotes: number;
  commentCount: number;
  userVotedOptionId: string | null;
}

export interface CreatePollData {
  question: string;
  options: string[];
  category?: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
}
