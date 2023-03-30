import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DecodedTokenInterface } from '../interfaces/token.interface';
import jwt_decode from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface RoomInterface {
	room_name: string;
	friend_id: number;
}
@Injectable({
	providedIn: 'root'
})
export class ChatService {

	private token: string;
	private decodedToken: DecodedTokenInterface | undefined;
	private rooms: RoomInterface[] = [];
	private hr: HttpHeaders;
	private url: string;
	constructor(private socket: Socket, private http: HttpClient) {
		this.url = 'http://localhost:4000/friends';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
		this.token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
		this.decodedToken = this.getDecodedAccessToken();
		if (this.decodedToken?.role === 'user') {
			this.socket.emit('join chat rooms', { token: this.token });
			this.socket.fromEvent('joined chat room').subscribe((room: any) => {
				this.rooms.push(room);
			});
		}
	}

	public sendMessage(message: string, friend_id: number) {

		const room = this.rooms.find((room) => room.friend_id === friend_id);
		if(!room) return;
		this.socket.emit('send chat message', { message: message, token: this.token, room: room });
	}

	public receiveMessage() {
		return this.socket.fromEvent('receive message');
	}
	public setSeen(friend_id: number) {
		const room = this.rooms.find((room) => room.friend_id === friend_id);
		if(!room) return;
		this.socket.emit('set seen', { token: this.token, room: room });
	}

	public getChatMessages(friend_id: number) {
		return this.http.get(`${this.url}/${friend_id}/chat`, { headers: this.hr });
	}
	public getDecodedAccessToken(): DecodedTokenInterface | undefined {
		const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
		try {
			return jwt_decode(token);
		} catch (Error) {
			return;
		}
	}
}
