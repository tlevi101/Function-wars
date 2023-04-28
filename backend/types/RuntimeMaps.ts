import { Game } from './utils/Game';
import { GroupChat } from './utils/GroupChat';
import { DecodedToken, socket } from './controllers/Interfaces';
import { WaitingRoom } from './utils/WaitingRoom';

export class RuntimeMaps {
    public static games = new Map<string, Game>();
    public static groupChats = new Map<string, GroupChat>();
    public static waitList = new Map<number | string, socket>();
    public static onlineUsers = new Map<number | string, { user: DecodedToken; socketID: string; currentURL: string }>();
    public static waitingRooms = new Map<string, WaitingRoom>();
    public static invites = new Set<{ inviterID: number; invitedID: number }>();
    constructor() {}
}
