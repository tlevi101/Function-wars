import { TestBed } from '@angular/core/testing';

import { WaitListService } from './wait-list.service';

describe('WaitListService', () => {
  let service: WaitListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
