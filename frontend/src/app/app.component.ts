import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { DecodedTokenInterface } from './interfaces/token.interface';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    title = 'Function Wars';
    public authorized = false;
    user: DecodedTokenInterface | undefined;

    constructor(private router: Router) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
			this.user = this.getDecodedAccessToken();
        }
    }

    ngOnInit(): void {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) this.authorized = true;
        else {
            this.authorized = false;
            if (!window.location.href.includes('reset-password')) this.router.navigate(['/login']);
        }
    }

    get isAuthorized(): boolean | null {
        if (localStorage.getItem('token') || sessionStorage.getItem('token')) return true;
        return false;
    }

    get isAdmin(): boolean | null {
        if (this.getDecodedAccessToken()?.is_admin) return true;
        return false;
    }

    get activatedRoute(): string {
        return this.router.url;
    }
    getDecodedAccessToken(): DecodedTokenInterface | undefined {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        try {
            return jwt_decode(token);
        } catch (Error) {
            return;
        }
    }
}
