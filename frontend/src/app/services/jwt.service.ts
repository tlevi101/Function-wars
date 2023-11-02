import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import { DecodedToken } from '../interfaces/token.interface';
import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn: 'root',
})
export class JwtService {
    constructor(private socket: Socket) {}

    public getToken(): string {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    }
    public isTokenValid(): boolean {
        return this.getDecodedAccessToken() !== undefined;
    }
    public getDecodedAccessToken(): DecodedToken | undefined {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        try {
            return jwt_decode(token);
        } catch (Error) {
            return;
        }
    }

    public updateToken(token?: string) {
        if (!token) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            return;
        }
        if (localStorage.getItem('token')) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
        }
    }

    public removeToken() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
		this.socket.disconnect();
    }

    public isGuestToken(): boolean {
        const decodedToken = this.getDecodedAccessToken();
        return decodedToken?.type === 'guest';
    }
}
