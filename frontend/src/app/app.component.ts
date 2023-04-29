import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {DecodedToken} from './interfaces/token.interface';
import {NavigatedService} from "./services/navigated.service";
import {InfoComponent} from "./pop-up/info/info.component";
import {SocketErrorService} from "./services/socket-error.service";
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';
import { UsersService } from './services/users.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    title = 'Function Wars';
    showNewGame = true;
    public authorized = false;
    user: DecodedToken | undefined;

    @ViewChild('infoComponent') infoComponent!: InfoComponent;

    constructor(private jwt:JwtService, private authService:AuthService,private router: Router, private activatedRoute: ActivatedRoute, private navigatedService: NavigatedService, private socketErrorService: SocketErrorService, private usersService: UsersService) {
		this.user = this.jwt.getDecodedAccessToken();
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

		this.usersService.listenBanned().subscribe(({message}) => {
			this.jwt.removeToken();
			this.infoComponent.description = message;
			this.infoComponent.buttonLink = '/';
		});

    }

    async ngOnInit(): Promise<void> {
		if(this.user && this.user?.type==='user'){
			await this.authService.updateToken();
		}
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
		const decodedToken = this.jwt.getDecodedAccessToken();
		if(decodedToken?.type==='guest') return false;
        if (decodedToken?.is_admin) return true;
        return false;
    }

    get activateRoute(): string {
        return this.router.url;
    }

	get isGuest(): boolean {
		return this.jwt.getDecodedAccessToken()?.type === 'guest';
	}

}
