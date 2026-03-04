import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsUploadedReviewEmail } from './is-uploaded-review-email';

describe('IsUploadedReviewEmail', () => {
  let component: IsUploadedReviewEmail;
  let fixture: ComponentFixture<IsUploadedReviewEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsUploadedReviewEmail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IsUploadedReviewEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
