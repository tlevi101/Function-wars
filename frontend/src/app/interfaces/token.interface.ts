export type DecodedToken = DecodedUserInterface | DecodedGuestInterface;

export interface DecodedUserInterface {
    readonly type: 'user';
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

export interface DecodedGuestInterface {
    readonly type: 'guest';
    readonly guest: true;
    id: string;
    name: string;
    JWT_created_at: Date;
    iat: number;
}
