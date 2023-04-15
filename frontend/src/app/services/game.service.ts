import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { JwtService } from './jwt.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private hr: HttpHeaders;
    private url: string;
    private token: string;
    constructor(private socket: Socket, private jwt: JwtService, private http: HttpClient) {
        this.url = 'http://localhost:4000/games';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
        this.token = jwt.getToken();
    }

    public getGameData(gameUUID: string) {
        return this.http.get(`${this.url}/${gameUUID}`, { headers: this.hr });
    }

    public listenGameData() {
        return this.socket.fromEvent('receive game data');
    }
}
