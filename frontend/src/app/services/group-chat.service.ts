import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtService } from './jwt.service';
import { Socket } from 'ngx-socket-io';
import { MessageInterface } from '../chats/group-chat/group-chat.component';
import { Observable } from 'rxjs';
import { OtherUsersStatusInterface } from '../interfaces/backend-body.interfaces';

@Injectable({
    providedIn: 'root',
})
export class GroupChatService {
    private hr: HttpHeaders;
    private url = 'http://localhost:4000/group-chats';
    constructor(private http: HttpClient, private jwt: JwtService, private socket: Socket) {
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${this.jwt.getToken()}`);
    }

    public getMessages(roomUUID: string) {
        return this.http.get<{ messages: MessageInterface[] }>(`${this.url}/${roomUUID}/messages`, {
            headers: this.hr,
        });
    }

    public joinGroupChat(roomUUID: string) {
        this.socket.emit('join group chat', { roomUUID });
    }

    public getOtherUsersStatus(roomUUID: string) {
        return this.http.get<{ users: OtherUsersStatusInterface[] }>(`${this.url}/${roomUUID}/users-status`, {
            headers: this.hr,
        });
    }

    public sendMessage(message: string) {
        this.socket.emit('send group chat message', { message: message, token: this.jwt.getToken() });
    }

    public receiveMessage(): Observable<MessageInterface> {
        return this.socket.fromEvent('receive group message');
    }

    public muteUser(roomUUID: string, user_id: number) {
        return this.http.post<{ message: string }>(`${this.url}/${roomUUID}/mute/${user_id}`, {}, { headers: this.hr });
    }

    public unmuteUser(roomUUID: string, user_id: number) {
        return this.http.post<{ message: string }>(
            `${this.url}/${roomUUID}/unmute/${user_id}`,
            {},
            { headers: this.hr }
        );
    }
}
