import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

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

	@Output() cancel = new EventEmitter();

	constructor() { }

	ngOnInit(): void {
		this.startTimer();
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


	cancelWaiting(){
		clearInterval(this.timer);
		this.cancel.emit();
	}

	public startTimer(){
		this.time = 0;
		this.timeText = '00:00';
		this.loadingText = 'Waiting for others...';
		this.timer = setInterval(() => this.tick(), 500);
	}
}
