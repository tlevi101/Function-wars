import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecodedToken } from '../interfaces/token.interface';
import { JwtService } from '../services/jwt.service';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {
    public name: string | undefined = 'User';
    public user: DecodedToken | undefined;
    constructor(private router: Router, private jwt:JwtService) {
        this.user = jwt.getDecodedAccessToken();
    }

    ngOnInit(): void {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            this.name = this.user?.name;
        }
    }
    get route() {
        return this.router.url;
    }
	get isAdmin(): boolean {
		return this.user?.type === 'user' && this.user?.is_admin;
	}
	get isGuest(): boolean {
		return this.user?.type === 'guest';
	}
    logout() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        this.router.navigate(['/login']);
    }
}
