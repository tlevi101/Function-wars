import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(private socket:Socket) { }

  public getGameData(gameUUID:string){
	this.socket.emit('get game data', gameUUID);
  }

  public listenGameData(){
	return this.socket.fromEvent('receive game data');
  }
}
