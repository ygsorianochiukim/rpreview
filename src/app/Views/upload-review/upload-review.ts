import { Component, OnInit } from '@angular/core'; // <-- import OnInit here
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../Services/review/review';
import { ReviewContext } from '../../Models/review/review-context.model';


@Component({
  selector: 'app-upload-review',
  templateUrl: './upload-review.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class UploadReviewComponent implements OnInit {
  documentno!: string;
  interments: ReviewContext[] = [];
  reviewForm: FormGroup;
  fbScreenshotFile?: File;
  googleScreenshotFile?: File;

  fbPreview: string | null = null;
googlePreview: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private reviewService: ReviewService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      reviewer_name: ['', Validators.required],
      q1: ['', Validators.required],
      q2: ['', Validators.required],
      q3: ['', Validators.required],
      q4: ['', Validators.required],
      q5: ['', Validators.required],
      q6: ['', Validators.required],
      others: [''],
      fb_username: [''],
      google_username: [''],
      fb_screenshot: [null],
      google_screenshot: [null]
    });
  }

  ngOnInit(): void {
    this.documentno = this.route.snapshot.paramMap.get('documentno')!;
    this.reviewService.getInterments(this.documentno).subscribe({
      next: data => this.interments = data,
      error: err => console.error(err)
    });
  }

onFbFileChange(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.fbScreenshotFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    this.fbPreview = reader.result as string;
  };
  reader.readAsDataURL(file);
}

onGoogleFileChange(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.googleScreenshotFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    this.googlePreview = reader.result as string;
  };
  reader.readAsDataURL(file);
}




  submitReview() {
    if (this.reviewForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('document_no', this.documentno);
    formData.append('reviewer_name', this.reviewForm.get('reviewer_name')?.value);
    formData.append('q1', this.reviewForm.get('q1')?.value);
    formData.append('q2', this.reviewForm.get('q2')?.value);
    formData.append('q3', this.reviewForm.get('q3')?.value);
    formData.append('q4', this.reviewForm.get('q4')?.value);
    formData.append('q5', this.reviewForm.get('q5')?.value);
    formData.append('q6', this.reviewForm.get('q6')?.value);
    formData.append('others', this.reviewForm.get('others')?.value || '');
    formData.append('fb_username', this.reviewForm.get('fb_username')?.value || '');
    formData.append('google_username', this.reviewForm.get('google_username')?.value || '');

    if (this.fbScreenshotFile) formData.append('fb_screenshot', this.fbScreenshotFile);
    if (this.googleScreenshotFile) formData.append('google_screenshot', this.googleScreenshotFile);

    this.reviewService.submitReview(formData).subscribe({
      next: res => alert(res.message), // just show a message
      error: err => {
        if (err.status === 422) {
          const errors = err.error.errors || { message: err.error.message };
          let msg = '';
          for (const key in errors) {
            if (errors.hasOwnProperty(key)) {
              msg += `${errors[key]}\n`;
            }
          }
          alert(msg); // show validation error
        } else {
          console.error(err);
          alert('Something went wrong.');
        }
      }
    });
  }


}


