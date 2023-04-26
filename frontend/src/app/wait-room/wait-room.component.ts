import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {CustomGameService} from "../services/custom-game.service";
import {InfoComponent} from "../pop-up/info/info.component";
import {JwtService} from "../services/jwt.service";
import {DecodedTokenInterface} from "../interfaces/token.interface";
import {GameService} from "../services/game.service";
import {WaitListService} from "../services/wait-list.service";

@Component({
  selector: 'app-wait-room',
  templateUrl: './wait-room.component.html',
  styleUrls: ['./wait-room.component.scss']
})
export class WaitRoomComponent implements OnInit, OnDestroy{

    roomUUID = '';
    chatRoomUUID = '';
    ownerID:number|undefined;
    user : DecodedTokenInterface | undefined;
    capacity = 2;
    userCount = 0;
    @ViewChild('infoComponent') infoComponent!: InfoComponent;
    constructor(
        private activatedRoute: ActivatedRoute,
        private waitRoomService: CustomGameService,
        private router:Router,
        private jwt:JwtService,
        private waitListService: WaitListService
    ) {
        this.waitRoomService.listenError().subscribe(({message, code}) => {
            this.displayInfo(message, code)
        });
        this.waitRoomService.waitRoomDeleted().subscribe(()=>{
            this.displayInfo('Owner left the wait room.', 404);
        })
        this.waitRoomService.userLeftWaitRoom().subscribe(()=>{
            this.userCount--;
        });
        this.waitRoomService.newUserJoined().subscribe(()=>{
            this.userCount++;
        })
        this.waitListService.joinedGame().subscribe((game:any)=>{
            console.log(game);
            this.router.navigate(['/games',game.room]);
        })
        this.user = jwt.getDecodedAccessToken();
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            const uuid = params.get('uuid');
            if(uuid){
                this.roomUUID = uuid;
                console.log(this.roomUUID);
                this.waitRoomService.joinCustomGame(uuid);
                this.listenWaitRoomJoined();
            }else{
                //TODO 404
            }
        })
    }

    ngOnDestroy(): void {
        this.waitRoomService.leaveCustomGame(this.roomUUID);
    }

    private listenWaitRoomJoined(){
        const subscription = this.waitRoomService.customGameJoined().subscribe(
            () => {
                this.sendGetWaitingRoomRequest();
            },
            (err:any) => {
                this.displayInfo(err.error.message);
            },
            () => {
                subscription.unsubscribe();
            }
        );
    }

    private sendGetWaitingRoomRequest(){
        const subscription = this.waitRoomService.getWaitingRoom(this.roomUUID).subscribe(
            ({waitRoom}) => {
                this.chatRoomUUID =  waitRoom.chatUUID;
                this.ownerID = waitRoom.owner.id;
                this.capacity = waitRoom.capacity;
                this.userCount = waitRoom.userCount;
            },
            (err:any) => {
                this.displayInfo(err.error.message, err.status);
            },
            () => {
                subscription.unsubscribe();
            }
        );
    }

    displayInfo(message: string, code?: number){
        if(code===403 || code===404){
            this.infoComponent.description = message;
            this.infoComponent.buttonLink = '/';
            this.infoComponent.buttonText = 'Quit';
            return;
        }
        this.infoComponent.description = message;
    }

    cancelCustomGame(){
        this.router.navigate(['/']);
    }

    startGame(){
        this.waitRoomService.startGame();
    }
}
