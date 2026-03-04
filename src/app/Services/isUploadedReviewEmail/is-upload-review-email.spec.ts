import { TestBed } from '@angular/core/testing';

import { IsUploadReviewEmail } from './is-upload-review-email';

describe('IsUploadReviewEmail', () => {
  let service: IsUploadReviewEmail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IsUploadReviewEmail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
