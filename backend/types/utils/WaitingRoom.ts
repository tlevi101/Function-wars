import {DecodedToken, socket} from "../controllers/Interfaces";
import {UserInterface} from "./interfaces";
import {RuntimeMaps} from "../RuntimeMaps";
const { faker } = require('@faker-js/faker');
const {Field} = require("../../models");

export class WaitingRoom{
    private fieldID: number;
    private players: DecodedToken[] = [];
    private owner: DecodedToken;
    private sockets: socket[] = [];
    private roomUUID: string = '';
    private capacity: number = 4;
    private privateRoom: boolean = false;
    constructor(owner:DecodedToken,fieldID: number, socket: socket, privateRoom: boolean = false) {
        this.fieldID = fieldID;
        this.sockets.push(socket);
        this.players.push(owner);
        this.owner = owner;
        this.roomUUID = `wait-room-${fieldID}-${this.players.map(p => p.id).join('-')}-${faker.random.alpha({count: 5} )}`;
        (async () => {
            console.log(fieldID);
            const field = await Field.findByPk(fieldID);
            this.capacity = field.field.players.length
        })();
        this.privateRoom = privateRoom;
    }

    destroy() {
        this.sockets.forEach(s => {
            s.emit('owner left');
            s.leave(this.roomUUID);
        });
        RuntimeMaps.waitingRooms.delete(this.roomUUID);
    }


    public leave(playerID:number) {
        this.players = this.players.filter(p => p.id !== playerID);
        this.sockets = this.sockets.filter(s => {
            if(s.decoded.id !== playerID){
                return true;
            }
            s.leave(this.roomUUID);
            return false;
        });
    }
    public join(player:DecodedToken, socket: socket) {
        if(this.players.some(p => p.id === player.id)) return;
        this.players.push(player);
        this.sockets.push(socket);
    }

    public playersToUserInterface() {
        return this.players.map(p => {
            return {
                id: p.id,
                name: p.name
            } as UserInterface;
        });
    }
    public userIsInRoom(playerID: number) {
        return this.players.some(p => p.id === playerID);
    }
    public isFull() {
        return this.players.length >= this.capacity;
    }

    public isOwner(playerID: number) {
        return this.owner.id === playerID;
    }
    toFrontend(){
        return {
            roomUUID: this.roomUUID,
            chatUUID: this.ChatUUID,
            owner: this.owner,
            players: this.players,
            fieldID: this.fieldID,
            userCount: this.players.length,
            capacity: this.capacity,
        };

    }
    public static toFrontendAll(room: WaitingRoom[]) {
        return room.map(r => {
            return {
                owner: r.owner,
                roomUUID: r.roomUUID,
                userCount: r.players.length,
                capacity: r.capacity,
                fieldID: r.fieldID,
            };
        });
    }


    public static publicRoomsFree(rooms: WaitingRoom[]) {
        return rooms.filter(r => r.isPublic && !r.isFull());
    }

    get ownerIsOnline(){
        return this.players.some(p => p.id === this.owner.id);
    }
    get isPrivate(): boolean {
        return this.privateRoom;
    }
    get isPublic(): boolean {
        return !this.privateRoom;
    }
    get Players(): DecodedToken[] {
        return this.players;
    }
    get Sockets(): socket[] {
        return this.sockets;
    }
    get UUID(): string {
        return this.roomUUID;
    }
    get ChatUUID(): string {
        return `chat-${this.roomUUID}`;
    }
}