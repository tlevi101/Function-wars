import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private hr;
  private url;
  constructor(private http: HttpClient) {
  this.url = 'http://localhost:4000/friends';
  this.hr = new HttpHeaders().set('Content-Type', 'application/json').append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
  }

  getFriends() {
    return this.http.get(`${this.url}`, { headers: this.hr });
  }

  deleteFriend(friendId: number) {
    return this.http.delete(`${this.url}/${friendId}`, { headers: this.hr });
  }
}
