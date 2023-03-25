import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
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
    this.url = 'http://localhost:4000/admin';
  }

  getUsers() {
    return this.http.get(`${this.url}/users`, { headers: this.hr });
  }

  banUser(userId: number, reason: string | undefined = undefined) {
    return this.http.put(`${this.url}/users/${userId}/ban`, {banned_reason:reason}, {
      headers: this.hr,
    });
  }

  unbanUser(userId: number) {
    return this.http.put(`${this.url}/users/${userId}/unban`, {}, {
      headers: this.hr,
    });
  }

  addRemoveChatRestrictionUsers(user_ids: any) {
    return this.http.put(`${this.url}/users/add-remove-chat-restriction`, {user_ids}, {
      headers: this.hr,
    });
  }

  deleteReport(reportId: number) {
	return this.http.delete(`${this.url}/reports/${reportId}`, { headers: this.hr });
	}

  getReports() {
    return this.http.get(`${this.url}/reports`, { headers: this.hr });
  }
}
