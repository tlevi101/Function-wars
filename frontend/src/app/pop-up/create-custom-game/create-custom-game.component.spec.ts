import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCustomGameComponent } from './create-custom-game.component';

describe('CreateCustomGameComponent', () => {
  let component: CreateCustomGameComponent;
  let fixture: ComponentFixture<CreateCustomGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateCustomGameComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCustomGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
