import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { DecodedToken } from '../interfaces/token.interface';

export interface WaitRoomResponseInterface {
    roomUUID: string;
    chatUUID: string;
    owner: DecodedToken;
    players: DecodedToken[];
    fieldID: number;
    userCount: number;
    capacity: number;
}
export interface CustomGameListItemInterface {
    owner: DecodedToken;
    roomUUID: string;
    userCount: number;
    capacity: number;
    fieldID: number;
}
@Injectable({
    providedIn: 'root',
})
export class CustomGameService {
    private hr: HttpHeaders;
    private url: string;
    private token: string;
    constructor(private jwt: JwtService, private http: HttpClient, private socket: Socket) {
        this.url = 'http://localhost:4000';
        this.token = jwt.getToken();
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${this.token || ''}`);
    }
    public createCustomGame(fieldID: number, isPrivate: boolean, friendIDs: number[]) {
        this.socket.emit('create custom game', { fieldID, isPrivate, friendIDs });
    }
    public waitRoomCreated() {
        return this.socket.fromEvent<{ roomUUID: string; groupChatUUID: string }>('waiting room created');
    }
    public waitRoomDeleted() {
        return this.socket.fromEvent('wait room owner left');
    }
    public joinCustomGame(roomUUID: string) {
        this.socket.emit('join custom game', { roomUUID });
    }

    public customGameJoined() {
        return this.socket.fromEvent('waiting room joined');
    }

    public leaveCustomGame(roomUUID: string) {
        this.socket.emit('leave custom game', { roomUUID });
    }

    public newUserJoined() {
        return this.socket.fromEvent('user joined waiting room');
    }

    public userLeftWaitRoom() {
        return this.socket.fromEvent('user left wait room');
    }

    public getCustomGames() {
        return this.http.get<{
            customGames: CustomGameListItemInterface[];
        }>(`${this.url}/custom-games`, { headers: this.hr });
    }

    public getWaitingRoom(roomUUID: string) {
        return this.http.get<{ waitRoom: WaitRoomResponseInterface }>(`${this.url}/wait-rooms/${roomUUID}`, {
            headers: this.hr,
        });
    }

    public startGame() {
        this.socket.emit('start custom game');
    }

    public kickPlayer(playerID: number | string, roomUUID: string) {
        return this.http.post(`${this.url}/wait-rooms/${roomUUID}/${playerID}/kick`, {}, { headers: this.hr });
    }

    public listenKicked() {
        return this.socket.fromEvent('kicked from wait room');
    }
}
