import { AfterContentChecked, AfterContentInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { DecodedTokenInterface } from 'src/app/interfaces/token.interface';
import { ChatService } from 'src/app/services/chat.service';

@Component({
    selector: 'app-friend-chat',
    templateUrl: './friend-chat.component.html',
    styleUrls: ['./friend-chat.component.scss'],
})
export class FriendChatComponent implements AfterContentChecked, AfterContentInit{
    math = Math;
	@Input() friendId: number | undefined;
	@Input() friendName: string | undefined;
	@ViewChild('chatContainer') chatContainer!: ElementRef;
	@ViewChild('sendInput') sendInput!: ElementRef;
	messages: any[] = [];
	user: DecodedTokenInterface | undefined;
	constructor(private chatService: ChatService) {
		this.user = chatService.getDecodedAccessToken(); 
		
	}
	ngAfterContentChecked(): void {
		this.scrollToBottom();
	}
	ngAfterContentInit(): void {
		this.scrollToBottom();
	}
	public sendMessage(message: string) {
		this.messages.push({from: this.user?.id, message, seen: false});
		this.chatService.sendMessage(message, this.friendId!);
		this.sendInput.nativeElement.value = '';
	}
	public closeChat() {
		this.friendId = undefined;
		this.friendName = undefined;
	}
	public loadChat(friend_id: number) {
		this.chatService.getChatMessages(friend_id).subscribe(
			(res: any) => {
				this.messages = res.chat.messages;
			},
			(err: any) => {
				console.log(err);
			},
		);
		this.chatService.receiveMessage().subscribe((message: any) => {
			this.messages.push(message);
		})
	}
	scrollToBottom(): void {
        try {
            this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
        } catch(err) {
		}                 
    }
}
