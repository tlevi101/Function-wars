import { TestBed } from '@angular/core/testing';

import { CustomGameService } from './custom-game.service';

describe('WaitRoomService', () => {
  let service: CustomGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
