export interface User {
  id: string;
  googleId: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Poll {
  id: string;
  userId: string;
  question: string;
  category: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  position: number;
  createdAt: Date;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  pollId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollWithDetails extends Poll {
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  options: Array<{
    id: string;
    optionText: string;
    position: number;
    voteCount: number;
  }>;
  totalVotes: number;
  commentCount: number;
  userVotedOptionId: string | null;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Augment express-session with proper module declaration
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
