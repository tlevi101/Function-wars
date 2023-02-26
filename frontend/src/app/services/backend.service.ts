import { importProvidersFrom, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginBodyInterface } from './interfaces/login-body';
import { RegisterBodyInterface } from './interfaces/register-body';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private url = 'https://localhost:4000';
  constructor(private http: HttpClient) { }

  login(body: LoginBodyInterface) {
    return this.http.post(`${this.url}/login`,body);
  }

  register(body: RegisterBodyInterface) {
    return this.http.post(`${this.url}/register`,body);
  }
}
