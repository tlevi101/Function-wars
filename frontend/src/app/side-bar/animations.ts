import { trigger, transition, state, animate, style } from '@angular/animations';

export const myAnimations = [
    trigger('slideLeftRight', [
        state(
            'right',
            style({
                right: '-85px',
            })
        ),
        state(
            'left',
            style({
                right: '0px',
            })
        ),
        transition('right => left', [animate('0.25s')]),
        transition('left => right', [animate('0.25s')]),
        transition('* => left', [animate('0.25s')]),
        transition('* => right', [animate('0.25s')]),
        transition('right <=> left', [animate('0.25s')]),
        transition('* => right', [animate('0.25s', style({ right: '*' }))]),
        transition('* => *', [animate('0.25s')]),
    ]),
    trigger('slideDownUp', [
        state(
            'up',
            style({
                height: '40px',
            })
        ),
        state(
            'down',
            style({
                height: '130px',
            })
        ),
        transition('up => down', [animate('0.25s')]),
        transition('down => up', [animate('0.25s')]),
        transition('* => down', [animate('0.25s')]),
        transition('* => up', [animate('0.25s')]),
        transition('up <=> down', [animate('0.25s')]),
        transition('* => up', [animate('0.25s', style({ height: '*' }))]),
        transition('* => *', [animate('0.25s')]),
    ]),
];
