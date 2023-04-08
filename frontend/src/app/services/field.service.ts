import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FieldBodyInterface } from '../interfaces/backend-body.interfaces';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
    private hr;
    private url;
  constructor(private jwt: JwtService, private http: HttpClient) {
	this.url = 'http://localhost:4000/friends';
        this.hr = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .append('Authorization', `Bearer ${this.jwt.getToken()}`);
   }

   postField(field: FieldBodyInterface) {
	   return this.http.post(`${this.url}/fields`, field, { headers: this.hr });
   }

   getFields() {
	   return this.http.get(`${this.url}/fields`, { headers: this.hr });
   }

   getField(fieldId: number) {
	   return this.http.get(`${this.url}/fields/${fieldId}`, { headers: this.hr });
   }
   
}
