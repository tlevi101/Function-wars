import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private hr;
  private url;
  constructor(private http: HttpClient) {
    this.hr = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .append(
        'Authorization',
        `Bearer ${
          localStorage.getItem('token') || sessionStorage.getItem('token')
        }`
      );
    this.url = 'http://localhost:4000/users';
  }

  blockUser(id: number) {
    return this.http.post(`${this.url}/${id}/block`, {}, { headers: this.hr });
  }
}
