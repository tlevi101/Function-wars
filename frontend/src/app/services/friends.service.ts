import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private hr = new HttpHeaders().set('Content-Type', 'application/json').append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
  private url = 'http://localhost:4000';
  constructor(private http: HttpClient, private router:Router) {}

  getFriends() {
    this.checkToken();
    return this.http.get(`${this.url}/user/friends`, { headers: this.hr });
  }

  deleteFriend(friendId: number) {
    this.checkToken();
    return this.http.delete(`${this.url}/user/friends/${friendId}`, { headers: this.hr });
  }

  checkToken() {
    this.http.get(`${this.url}/validate-token`, { headers: this.hr }).subscribe(
      (res: any) => {
      },
      (err: any) => {
        console.log(err);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    );
  }
}
