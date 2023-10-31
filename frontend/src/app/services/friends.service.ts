import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DecodedToken } from '../interfaces/token.interface';
import { Socket } from 'ngx-socket-io';
import API_URL from './API_URL';

@Injectable({
    providedIn: 'root',
})
export class FriendsService {
    private hr;
    private url;
    public friendDeleted: EventEmitter<number>;
    constructor(private http: HttpClient, private socket: Socket) {
        this.friendDeleted = new EventEmitter();
        this.url = API_URL + '/friends' || 'http://localhost:4000/friends';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
    }

    getFriends() {
        return this.http.get(`${this.url}`, { headers: this.hr });
    }

    getOnlineFriends(): Observable<{ friends: { id: number; name: string; unreadMessages: number }[] }> {
        return this.http.get<{ friends: { id: number; name: string; unreadMessages: number }[] }>(
            `${this.url}/online`,
            { headers: this.hr }
        );
    }

    deleteFriend(friendId: number) {
        this.friendDeleted.emit(friendId);
        return this.http.delete(`${this.url}/${friendId}`, { headers: this.hr });
    }

    getFriendRequests() {
        return this.http.get(`${this.url}/requests`, { headers: this.hr });
    }

    acceptFriendRequest(friendId: number) {
        return this.http.put(`${this.url}/requests/${friendId}/accept`, {}, { headers: this.hr });
    }

    rejectFriendRequest(friendId: number) {
        return this.http.delete(`${this.url}/requests/${friendId}/reject`, {
            headers: this.hr,
        });
    }

    addFriend(friendId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.url}/${friendId}`, {}, { headers: this.hr });
    }

    receiveInvite(): Observable<{ inviter: DecodedToken; customGameUUID: string }> {
        return this.socket.fromEvent('receive invite');
    }

    inviteRejected(invite: { inviterID: number; invitedID: number }) {
        this.socket.emit('reject invite', { invite });
    }
}
