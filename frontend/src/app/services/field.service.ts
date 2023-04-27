import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FieldBodyInterface } from '../interfaces/backend-body.interfaces';

@Injectable({
    providedIn: 'root',
})
export class FieldService {
    private hr;
    private url;
    constructor(private jwt: JwtService, private http: HttpClient) {
        this.url = 'http://localhost:4000/fields';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${this.jwt.getToken()}`);
    }

    postField(field: FieldBodyInterface) {
        return this.http.post(`${this.url}`, field, { headers: this.hr });
    }

    putField(fieldId: number, field: FieldBodyInterface) {
        return this.http.put(`${this.url}/${fieldId}`, field, { headers: this.hr });
    }

    getFields() {
        return this.http.get(`${this.url}`, { headers: this.hr });
    }

    getField(fieldId: number) {
        return this.http.get(`${this.url}/${fieldId}`, { headers: this.hr });
    }

    showField(fieldId: number) {
        return this.http.get(`${this.url}/${fieldId}/show`, { headers: this.hr });
    }

    deleteField(fieldId: number) {
        return this.http.delete(`${this.url}/${fieldId}`, { headers: this.hr });
    }

    getFieldByGame(gameUUID: string) {
        const url = this.url.replace('fields', 'games');
        return this.http.get(`${url}/${gameUUID}/field`, { headers: this.hr });
    }

    getPlayersByGame(gameUUID: string) {
        const url = this.url.replace('fields', 'games');
        return this.http.get(`${url}/${gameUUID}/players`, { headers: this.hr });
    }

	restoreField(fieldId: number) {
		return this.http.put(`${this.url}/${fieldId}/restore`, {}, { headers: this.hr });
	}
}
