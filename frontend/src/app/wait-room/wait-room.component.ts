import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {CustomGameService} from "../services/custom-game.service";
import {FieldService} from "../services/field.service";

@Component({
  selector: 'app-wait-room',
  templateUrl: './wait-room.component.html',
  styleUrls: ['./wait-room.component.scss']
})
export class WaitRoomComponent implements OnInit, OnDestroy{

    roomUUID = '';
    chatRoomUUID = '';
    constructor(
        private activatedRoute: ActivatedRoute,
        private waitRoomService: CustomGameService,
        private fieldService: FieldService,
    ) {
        //TODO listen errors
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
                console.log(err);
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
                console.log(err);
            },
            () => {
                subscription.unsubscribe();
            }
        );
    }

}
