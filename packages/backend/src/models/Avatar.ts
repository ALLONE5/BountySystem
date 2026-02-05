export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  requiredRank: number;
  createdAt: Date;
}

export interface AvatarCreateDTO {
  name: string;
  imageUrl: string;
  requiredRank: number;
}

export interface AvatarUpdateDTO {
  name?: string;
  imageUrl?: string;
  requiredRank?: number;
}
