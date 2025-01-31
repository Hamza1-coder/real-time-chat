export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
};

export type Friend = {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
};