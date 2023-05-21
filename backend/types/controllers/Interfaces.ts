import { Game } from '../utils/Game';
import { GroupChat } from '../utils/GroupChat';
import { Request, Response } from 'express';
import { WaitingRoom } from '../utils/WaitingRoom';

/**
 * @property user : DecodedToken
 * @property games : GamesMap
 * @property groupChats : GroupChatsMap
 * @property waitList : WaitListMap
 * @property onlineUsers : OnlineUsersMap
 * @property waitingRooms : WaitingRoomsMap
 */
export type MyRequest = Request & {
    user: DecodedToken;
    games: GamesMap;
    groupChats: GroupChatsMap;
    waitList: WaitListMap;
    onlineUsers: OnlineUsersMap;
    waitingRooms: WaitingRoomsMap;
};
/**
 * @property io : any
 */
export type MyResponse = Response & {
    io: any & {
        to(socketID: string): Function;
        emit(event: string, data?: Object): Function;
        in(roomID: string): Function;
    };
};

export type DecodedToken = DecodedUser | GuestUser;
/**
 * @property id : number
 * @property name : string
 * @property email : string
 * @property banned : boolean
 * @property banned_reason : string
 * @property is_admin : boolean
 * @property role : string
 * @property JWT_created_at : Date
 * @property chat_restriction : boolean
 * @property iat : number
 */
export interface DecodedUser {
    type: 'registeredUser';
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
/**
 * @property type : 'guest'
 * @property name : string
 * @property uuid : string
 * @property JWT_created_at : Date
 * @property iat : number
 */
export interface GuestUser {
    readonly type: 'guest';
    name: string;
    id: string;
    JWT_created_at: Date;
    iat: number;
}
/**
 * @property decoded : DecodedToken
 * @property id : string
 */
export type socket = {
    decoded: DecodedToken;
    id: string;
    emit(event: string, data?: Object): socket;
    on(): socket;
    join(roomID: string): socket;
    leave(roomID: string): socket;
    to(socketID: string): socket;
};

type userID = number | string;
export type GamesMap = Map<string, Game>;
export type GroupChatsMap = Map<string, GroupChat>;
export type WaitListMap = Map<userID, socket>;
export type OnlineUsersMap = Map<userID, { user: DecodedToken; socketID: string }>;
export type WaitingRoomsMap = Map<string, WaitingRoom>;
