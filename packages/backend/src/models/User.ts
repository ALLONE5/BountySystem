export enum UserRole {
  USER = 'user',
  POSITION_ADMIN = 'position_admin',
  SUPER_ADMIN = 'super_admin',
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarId: string | null;
  role: UserRole;
  balance: number;
  createdAt: Date;
  lastLogin: Date | null;
  updatedAt: Date;
}

export interface UserCreateDTO {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
  avatarId?: string;
  lastLogin?: Date;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatarId: string | null;
  avatarUrl?: string;
  role: UserRole;
  balance: number;
  createdAt: Date;
  lastLogin: Date | null;
  positions?: { id: string; name: string }[];
  managedPositions?: { id: string; name: string }[];
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
