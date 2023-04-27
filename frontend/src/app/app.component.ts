import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import jwt_decode from 'jwt-decode';
import {DecodedTokenInterface} from './interfaces/token.interface';
import {NavigatedService} from "./services/navigated.service";
import {InfoComponent} from "./pop-up/info/info.component";
import {SocketErrorService} from "./services/socket-error.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    title = 'Function Wars';
    showNewGame = true;
    public authorized = false;
    user: DecodedTokenInterface | undefined;

    @ViewChild('infoComponent') infoComponent!: InfoComponent;

    constructor(private router: Router, private activatedRoute: ActivatedRoute, private navigatedService: NavigatedService, private socketErrorService: SocketErrorService) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            this.user = this.getDecodedAccessToken();
        }
        this.router.events.subscribe(
            (event) => {
                if (event instanceof NavigationEnd) {
                    this.navigatedService.routeChange(event.url);
                }
            }
        )
        this.socketErrorService.listenError().subscribe((error) => {
                this.infoComponent.description = error.message;
                if (error.code === 403 || error.code === 404) {
                    this.infoComponent.buttonLink = '/';
                }
            }
        );
    }

    ngOnInit(): void {
        this.activatedRoute.url.subscribe(url => {
            console.log(url);
        });
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

    get activateRoute(): string {
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
