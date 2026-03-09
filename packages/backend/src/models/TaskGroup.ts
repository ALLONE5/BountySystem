export interface TaskGroup {
  id: string;
  name: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: Date;
}

export interface GroupMemberDetail extends GroupMember {
  username: string;
  email: string;
  role?: string;
  avatarId?: string;
}

export interface TaskGroupCreateDTO {
  name: string;
  creatorId: string;
}

export interface TaskGroupWithMembers extends TaskGroup {
  memberIds: string[];
  members?: GroupMemberDetail[];
}
