import { TestBed } from '@angular/core/testing';

import { Landing } from './landing';

describe('Landing', () => {
  let service: Landing;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Landing);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
