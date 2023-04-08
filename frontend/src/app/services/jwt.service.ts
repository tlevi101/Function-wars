import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import { DecodedTokenInterface } from '../interfaces/token.interface';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  public getToken(): string {
	return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
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
