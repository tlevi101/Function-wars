import {AfterViewInit, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {FriendsService} from "../../services/friends.service";
import {InfoComponent} from "../info/info.component";
import {FieldService} from "../../services/field.service";
import {CustomGameService} from "../../services/custom-game.service";
import {Router} from "@angular/router";

interface Friend{
    id: number;
    name: string;
    //NOTE unreadMessages is irrelevant for this component
    unreadMessages: number;
}
interface Field{
    id: number;
    name:string;
}
@Component({
  selector: 'app-create-custom-game',
  templateUrl: './create-custom-game.component.html',
  styleUrls: ['./create-custom-game.component.scss']
})
export class CreateCustomGameComponent implements AfterViewInit{

    @ViewChild('infoComponent') infoComponent!:InfoComponent
    @Output() cancel = new EventEmitter<void>();
    customGameCreation: FormGroup;
    onlineFriends: Friend[] = [];
    myFields: Field[] = [];
    constructor(
        private friendsService: FriendsService,
        private fieldService: FieldService,
        private waitRoomService: CustomGameService,
        private router: Router
    ){
        this.customGameCreation = new FormGroup({
            fieldSelect: new FormControl('Choose a field!',[
                Validators.required,
            ]),
            friends:new FormArray([]),
            isPrivate: new FormControl(false)
        });


    }

    ngAfterViewInit() {
        this.sendGetFriendsRequest();
        this.sendGetFieldsRequest();
    }


    sendGetFriendsRequest(){
        const subscription = this.friendsService.getOnlineFriends().subscribe(
            ({friends}) => {
                this.onlineFriends = friends;
            },
            (err:any) => {
                this.infoComponent.description = err.error.message;
            },
            ()=>{
                subscription.unsubscribe();
            }
        );
    }

    onSubmit(){
        const fieldId = this.fieldSelect?.value;
        const isPrivate = this.isPrivate?.value;
        // const friends = this.friends.controls.map((friend: AbstractControl)=>{return friend.value});
        //send invite to friends
        this.waitRoomService.createCustomGame(fieldId, isPrivate);
        const subscription = this.waitRoomService.waitRoomCreated().subscribe(
            ({roomUUID})=>{
                this.router.navigate(['/wait-rooms', roomUUID]);
            },
            (err:any)=>{
                this.infoComponent.description = err.error.message;
            },
            ()=>{
                subscription.unsubscribe();
            }
        );
    }

    sendGetFieldsRequest(){
        const subscription = this.fieldService.getFields().subscribe(
        (res:any)=>{
            this.myFields = res.fields.map((field:any)=>{return {id:field.id, name:field.name}});
        },
        (err:any)=>{
            this.infoComponent.description = err.error.message;
        },
        ()=>{
            subscription.unsubscribe();
        }
        );
    }

    onFriendAdd(event: any) {
           const friendsArray = this.friends;
           if(event.target.checked){
               friendsArray.push(new FormControl(event.target.value));
           }else {
               friendsArray.controls.forEach((friend: AbstractControl, index:number) =>{
                     if(friend.value === event.target.value){
                          friendsArray.removeAt(index);
                          return;
                     }
               });
           }
    }

    get fieldSelect() {
        return this.customGameCreation.get('fieldSelect');
    }
    get isPrivate() {
        return this.customGameCreation.get('isPrivate');
    }
    get friends() {
        return this.customGameCreation.get('friends') as FormArray<FormControl>;
    }
}
