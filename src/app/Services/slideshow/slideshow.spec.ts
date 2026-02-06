import { TestBed } from '@angular/core/testing';

import { Slideshow } from './slideshow';

describe('Slideshow', () => {
  let service: Slideshow;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Slideshow);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
