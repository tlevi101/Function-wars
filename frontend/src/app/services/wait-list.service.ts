import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WaitListService {

  	constructor(private socket:Socket) { }

	public joinWaitList(){
		this.socket.emit('join wait list');
	}

	public leaveWaitList(){
		this.socket.emit('leave wait list');
	}

	public joinedGame(){
		return this.socket.fromEvent('joined game');
	}
}
