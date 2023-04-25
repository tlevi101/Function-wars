import { TestBed } from '@angular/core/testing';

import { NavigatedService } from './navigated.service';

describe('NavigatedService', () => {
  let service: NavigatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
