import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { DecodedTokenInterface } from '../interfaces/token.interface';

export interface WaitRoomResponseInterface {
    roomUUID: string;
    chatUUID: string;
    owner: DecodedTokenInterface;
    players: DecodedTokenInterface[];
    fieldID: number;
    userCount: number;
    capacity: number;
}
export interface CustomGameListItemInterface {
    owner: DecodedTokenInterface;
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

    public listenError() {
        return this.socket.fromEvent<{ message: string, code?:number }>('error');
    }
    public createCustomGame(fieldID: number, isPrivate: boolean) {
        this.socket.emit('create custom game', { fieldID, isPrivate });
    }
    public waitRoomCreated() {
        return this.socket.fromEvent<{ roomUUID: string; groupChatUUID: string }>('waiting room created');
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

    public getCustomGames() {
        return this.http.get<{
            customGames: CustomGameListItemInterface[];
        }>(`${this.url}/custom-games`, { headers: this.hr });
    }

    public getWaitingRoom(roomUUID: string) {
        return this.http.get<{ waitRoom: WaitRoomResponseInterface }>(`${this.url}/wait-rooms/${roomUUID}`, { headers: this.hr });
    }
}
