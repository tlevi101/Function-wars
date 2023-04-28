import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import { DecodedTokenInterface } from '../interfaces/token.interface';

@Injectable({
    providedIn: 'root',
})
export class JwtService {
    constructor() {}

    public getToken(): string {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    }
    public isTokenValid(): boolean {
        return this.getDecodedAccessToken() !== undefined;
    }
    public getDecodedAccessToken(): DecodedTokenInterface | undefined {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        try {
            return jwt_decode(token);
        } catch (Error) {
            return;
        }
    }

	public updateToken(token?: string) {
		if(!token){
			localStorage.removeItem('token');
			sessionStorage.removeItem('token');
			return;
		}
		if(localStorage.getItem('token')) {
			localStorage.setItem('token', token);
		} else {
			sessionStorage.setItem('token', token);
		}
	}

	public removeToken(){
		localStorage.removeItem('token');
		sessionStorage.removeItem('token');
	}
}
