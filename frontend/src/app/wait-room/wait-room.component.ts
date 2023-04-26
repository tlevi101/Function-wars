import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {CustomGameService} from "../services/custom-game.service";
import {InfoComponent} from "../pop-up/info/info.component";

@Component({
  selector: 'app-wait-room',
  templateUrl: './wait-room.component.html',
  styleUrls: ['./wait-room.component.scss']
})
export class WaitRoomComponent implements OnInit, OnDestroy{

    roomUUID = '';
    chatRoomUUID = '';
    @ViewChild('infoComponent') infoComponent!: InfoComponent;
    constructor(
        private activatedRoute: ActivatedRoute,
        private waitRoomService: CustomGameService,
    ) {
        this.waitRoomService.listenError().subscribe(({message, code}) => {
            this.displayInfo(message, code)
        });
        this.waitRoomService.waitRoomDeleted().subscribe(()=>{
            this.displayInfo('Owner left the wait room.', 404);
        })
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
                console.log(waitRoom);
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

}
