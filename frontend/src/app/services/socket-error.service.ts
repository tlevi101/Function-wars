import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn: 'root',
})
export class SocketErrorService {
    constructor(private socket: Socket) {}

    listenError(){
        return this.socket.fromEvent<{message:string, code:number}>('error')
    }
}
