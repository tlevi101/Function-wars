import { trigger, transition, state, animate, style, AnimationEvent, query } from '@angular/animations';


export const myAnimations = [
	trigger('slideLeftRight', [
		state('right', style({
			right: '-85px'
		})),
		state('left', style({
			right: '0px'
		})),
		transition('right => left', [
			animate('0.5s')
		]),
		transition('left => right', [
			animate('0.5s')
		]),
		transition('* => left', [
			animate('0.5s')
		]),
		transition('* => right', [
			animate('0.5s')
		]),
		transition('right <=> left', [
			animate('0.5s')
		]),
		transition('* => right', [
			animate('0.5s',
				style({ right: '*' }),
			),
		]),
		transition('* => *', [
			animate('0.5s')
		]),
	]),
	trigger('slideDownUp', [
		state('up', style({
			height: '50px'
		})),
		state('down', style({
			height: '160px'
		})),
		transition('up => down', [
				animate('0.5s')
		]),
		transition('down => up', [
				animate('0.5s')
		]),
		transition('* => down', [
				animate('0.5s')
		]),
		transition('* => up', [
				animate('0.5s')
		]),
		transition('up <=> down', [
			animate('0.5s')
		]),
		transition('* => up', [
				animate('0.5s',
					style({ height: '*' }),
				),
		]),
		transition('* => *', [
			animate('0.5s')
		]),
	]),
];