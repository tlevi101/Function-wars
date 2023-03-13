export interface DecodedTokenInterface {
  id: number;
  name: string;
  email: string;
  banned: boolean;
  banned_reason: string;
  is_admin: boolean;
  role: string;
  JWT_created_at: Date;
  chat_restriction: boolean;
  iat: number;
}
