import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnWaitingComponent } from './on-waiting.component';

describe('OnWaitingComponent', () => {
    let component: OnWaitingComponent;
    let fixture: ComponentFixture<OnWaitingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OnWaitingComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(OnWaitingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
