import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DecodedToken } from '../interfaces/token.interface';
import jwt_decode from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private token: string;
    private decodedToken: DecodedToken | undefined;
    private hr: HttpHeaders;
    private url: string;
    constructor(private socket: Socket, private http: HttpClient) {
        this.url = 'http://localhost:4000/friends';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        this.decodedToken = this.getDecodedAccessToken();
    }

    public sendMessage(message: string, friend_id: number) {
        this.socket.emit('send chat message', { message: message, token: this.token, friend_id });
    }

    public receiveMessage() {
        return this.socket.fromEvent('receive message');
    }
    public setSeen(friend_id: number) {
        this.socket.emit('set seen', { token: this.token, friend_id });
    }

    public getChatMessages(friend_id: number) {
        return this.http.get(`${this.url}/${friend_id}/chat`, { headers: this.hr });
    }
    public getDecodedAccessToken(): DecodedToken | undefined {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        try {
            return jwt_decode(token);
        } catch (Error) {
            return;
        }
    }
}
