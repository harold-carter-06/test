export interface UserSignedInEvent {
  userId: string;
  domain: string;
  email: string;
  createdAt: number;
}
