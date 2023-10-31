import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { JwtService } from './jwt.service';
import { catchError, retry, timeout } from 'rxjs';
import API_URL from './API_URL';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private hr: HttpHeaders;
    private url: string;
    private token: string;
    constructor(private socket: Socket, private jwt: JwtService, private http: HttpClient) {
		this.url = API_URL + '/games' || 'http://localhost:4000/games';

        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
        this.token = jwt.getToken();
    }

    public getGameData(gameUUID: string) {
        return this.http.get(`${this.url}/${gameUUID}`, { headers: this.hr }).pipe(timeout(1000), retry(3));
    }

    public submitFunction(gameUUID: string, fn: string) {
        return this.http.post(`${this.url}/${gameUUID}/function`, { fn }, { headers: this.hr });
    }

    public receiveFunction() {
        return this.socket.fromEvent('receive function');
    }
    public gameEnded() {
        return this.socket.fromEvent('game ended');
    }
    public gameOver() {
        return this.socket.fromEvent('game over');
    }
    public listenUserBanned() {
        return this.socket.fromEvent<{ message: string }>('user banned');
    }
    get Socket() {
        return this.socket;
    }
}
