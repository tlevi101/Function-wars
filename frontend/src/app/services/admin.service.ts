import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry } from 'rxjs';
import API_URL from './API_URL';

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private hr;
    private url;
    constructor(private http: HttpClient) {
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
        this.url = API_URL || 'http://localhost:4000';
    }

    getUsers() {
        return this.http.get(`${this.url}/users`, { headers: this.hr });
    }

    getAdmins() {
        return this.http.get(`${this.url}/admins`, { headers: this.hr });
    }

    banUser(userId: number, reason: string | undefined = undefined) {
        return this.http.put(
            `${this.url}/users/${userId}/ban`,
            { banned_reason: reason },
            {
                headers: this.hr,
            }
        );
    }

    unbanUser(userId: number) {
        return this.http.put(
            `${this.url}/users/${userId}/unban`,
            {},
            {
                headers: this.hr,
            }
        );
    }

    addRemoveChatRestrictionUsers(userId: any) {
        return this.http.put(
            `${this.url}/users/${userId}/add-remove-chat-restriction`,
            {},
            {
                headers: this.hr,
            }
        );
    }

    deleteReport(reportId: number) {
        return this.http.delete(`${this.url}/reports/${reportId}`, {
            headers: this.hr,
        });
    }

    getReports() {
        return this.http.get(`${this.url}/reports`, { headers: this.hr });
    }

    makeAdmin(userId: number) {
        return this.http.put(`${this.url}/users/${userId}/make-admin`, {}, { headers: this.hr });
    }

    removeAdmin(userId: number) {
        return this.http.put(`${this.url}/users/${userId}/remove-admin`, {}, { headers: this.hr });
    }
}
