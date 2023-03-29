import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
    RegisterBodyInterface,
    LoginBodyInterface,
    ForgotPasswordBodyInterface,
    ResetPasswordBodyInterface,
} from '../interfaces/backend-body.interfaces';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private hr = new HttpHeaders().set('Content-Type', 'application/json');
    private url = 'http://localhost:4000';
    constructor(private http: HttpClient) {}

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
}
