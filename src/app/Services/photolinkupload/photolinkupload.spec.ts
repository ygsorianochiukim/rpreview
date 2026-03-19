import { TestBed } from '@angular/core/testing';

import { Photolinkupload } from './photolinkupload';

describe('Photolinkupload', () => {
  let service: Photolinkupload;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Photolinkupload);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
