import { Game } from '../utils/Game';
import { GroupChat } from '../utils/GroupChat';
import { Request, Response } from 'express';
import { WaitingRoom } from '../utils/WaitingRoom';

export type MyRequest = Request & {
    user: DecodedToken;
    games: GamesMap;
    groupChats: GroupChatsMap;
    waitList: WaitListMap;
    onlineUsers: OnlineUsersMap;
    waitingRooms: WaitingRoomsMap;
};

export type MyResponse = Response & {
    io: any & {
        to(socketID: string): Function;
        emit(event: string, data?: Object): Function;
        in(roomID: string): Function;
    };
};
export interface DecodedToken {
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
export type socket = any & {
    decoded: DecodedToken;
    id: string;
    emit(event: string, data?: Object): Function;
    on(): Function;
    join(roomID: string): Function;
    leave(roomID: string): Function;
    to(socketID: number): Function;
};

type userID = number;
export type GamesMap = Map<string, Game>;
export type GroupChatsMap = Map<string, GroupChat>;
export type WaitListMap = Map<userID, socket>;
export type OnlineUsersMap = Map<userID, { user: DecodedToken; socketID: string }>;
export type WaitingRoomsMap = Map<string, WaitingRoom>;
