import { TestBed } from '@angular/core/testing';

import { WaitRoomService } from './wait-room.service';

describe('WaitRoomService', () => {
  let service: WaitRoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitRoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
