import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
    RegisterBodyInterface,
    LoginBodyInterface,
    ForgotPasswordBodyInterface,
    ResetPasswordBodyInterface,
} from '../interfaces/backend-body.interfaces';
import { JwtService } from './jwt.service';
import { Socket } from 'ngx-socket-io';
import API_URL from '../env/API_URL';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private hr = new HttpHeaders().set('Content-Type', 'application/json');
    private url = API_URL;
    constructor(private http: HttpClient, private jwt: JwtService, private socket: Socket) {
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${jwt.getToken()}`);
    }

    login(body: LoginBodyInterface) {
        return this.http.post(`${this.url}/login`, body, { headers: this.hr });
    }

    register(body: RegisterBodyInterface) {
        return this.http.post(`${this.url}/register`, body, { headers: this.hr });
    }

    forgotPassword(body: ForgotPasswordBodyInterface) {
        return this.http.post(`${this.url}/forgot-password`, body, {
            headers: this.hr,
        });
    }

    resetPassword(uuid: string, body: ResetPasswordBodyInterface) {
        return this.http.put(`${this.url}/reset-password/${uuid}`, body, {
            headers: this.hr,
        });
    }

    registerGuest(body: RegisterBodyInterface) {
        return this.http.post(`${this.url}/register-guest`, body, {
            headers: this.hr,
        });
    }

    async updateToken() {
        await this.http
            .get(`${this.url}/update-token`, {
                headers: this.hr,
            })
            .toPromise()
            .then(
                (res: any) => {
                    this.jwt.updateToken(res.jwt);
                },
                (err: any) => {
                    this.jwt.updateToken();
                }
            );
    }

    connectSocket(token: string) {
        this.socket.ioSocket.io.opts.query = {
            token: token,
        };
        this.socket.connect();
    }

    disconnectSocket() {
        this.socket.disconnect();
    }
}
