import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CustomGameListItemInterface, CustomGameService} from "../../services/custom-game.service";
import {PaginationComponent} from "../pagination/pagination.component";
import {InfoComponent} from "../../pop-up/info/info.component";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";

@Component({
  selector: 'app-custom-games',
  templateUrl: './custom-games.component.html',
  styleUrls: ['./custom-games.component.scss']
})
export class CustomGamesComponent implements OnInit, AfterViewInit, OnDestroy{

    customGames: CustomGameListItemInterface[] = [];
    page = 1;
    pageSize = 4;
    private socketErrorSubscription: Subscription;
    @ViewChild('pagination') pagination!: PaginationComponent;
    @ViewChild('infoComponent') infoComponent!: InfoComponent;

    constructor(
        private customGameService: CustomGameService,
        private router: Router
    ) {
        this.customGameService.getCustomGames().subscribe(({customGames}) => {
            this.customGames = customGames;
        })
        this.socketErrorSubscription = this.customGameService.listenError().subscribe(
        ({message}) => {
            this.infoComponent.description = message;
        });

    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this.socketErrorSubscription.unsubscribe();
    }

    joinGame(roomUUID: string) {
        this.customGameService.joinCustomGame(roomUUID);
        const subscription = this.customGameService.customGameJoined().subscribe(() => {
                this.router.navigate(['/custom-games', roomUUID]);
        },
        (error) => {
                console.log(error);
        },
        () => {
                subscription.unsubscribe();
        });
    }
}
