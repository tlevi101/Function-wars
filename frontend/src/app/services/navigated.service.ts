import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn: 'root',
})
export class NavigatedService {
    constructor(private socket: Socket) {}

    public routeChange(url:string) {
        this.socket.emit('route change', {url});
    }
}
