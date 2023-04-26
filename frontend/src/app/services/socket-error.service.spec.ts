import { TestBed } from '@angular/core/testing';

import { SocketErrorService } from './socket-error.service';

describe('SocketErrorService', () => {
  let service: SocketErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
