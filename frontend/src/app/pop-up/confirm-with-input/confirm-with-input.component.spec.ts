import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmWithInputComponent } from './confirm-with-input.component';

describe('ConfirmWithInputComponent', () => {
  let component: ConfirmWithInputComponent;
  let fixture: ComponentFixture<ConfirmWithInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmWithInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmWithInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
