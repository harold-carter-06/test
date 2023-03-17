export interface DeductCreditsEvent {
  domain: string;
  createdAt: number;
  credits: number;
  deductReason: string;
}
