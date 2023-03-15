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

  getFriendRequests() {
    return this.http.get(`${this.url}/requests`, { headers: this.hr });
  }

  acceptFriendRequest(friendId: number) {
    return this.http.put(`${this.url}/requests/${friendId}/accept`, {}, { headers: this.hr });
  }

  rejectFriendRequest(friendId: number) {
    return this.http.delete(`${this.url}/requests/${friendId}/reject`, { headers: this.hr });
  }
}
