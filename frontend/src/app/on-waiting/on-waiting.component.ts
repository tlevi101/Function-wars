import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
	selector: 'app-on-waiting',
	templateUrl: './on-waiting.component.html',
	styleUrls: ['./on-waiting.component.scss']
})
export class OnWaitingComponent implements OnInit, OnDestroy {
	
	loadingText = 'Waiting for others...';
	time = 0;
	timeText = '00:00';
	timer: any;
	constructor() { }

	ngOnInit(): void {
		this.timer = setInterval(() => this.tick(), 500);
	}

	ngOnDestroy(): void {
		clearInterval(this.timer);
	}

	tick(): void{
		if(this.loadingText.includes('......')){
			this.loadingText = this.loadingText.replace('......', '...');
		}
		else{
			this.loadingText += '.';
		}
		this.time+=500;
		this.formatTime();
	}

	formatTime(): void{
		let time = Math.floor(this.time/1000);
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;
		this.timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

}
