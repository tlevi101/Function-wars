import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UsersService {
    private hr;
    private url;
    constructor(private http: HttpClient, private socket:Socket) {
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`);
        this.url = 'http://localhost:4000/users';
    }

    blockUser(id: number) {
        return this.http.post(`${this.url}/${id}/block`, {}, { headers: this.hr });
    }

    unblockUser(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.url}/${id}/unblock`, { headers: this.hr });
    }

    reportUser(id: number, description: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.url}/${id}/report`, { description }, { headers: this.hr });
    }

	listenBanned(){
		return this.socket.fromEvent<{message: string}>('banned');
	}
}
