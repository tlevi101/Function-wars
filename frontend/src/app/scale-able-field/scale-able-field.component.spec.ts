import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScaleAbleFieldComponent } from './scale-able-field.component';

describe('ScaleAbleFieldComponent', () => {
    let component: ScaleAbleFieldComponent;
    let fixture: ComponentFixture<ScaleAbleFieldComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScaleAbleFieldComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ScaleAbleFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
