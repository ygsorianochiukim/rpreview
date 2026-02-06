import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SlideshowService } from '../../Services/slideshow/slideshow';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './slideshow.html',
  styleUrls: ['./slideshow.scss']
})
export class SlideshowComponent implements OnInit {

  uploadForm!: FormGroup;

  documentNo = '';
  occupantName = '';
  intermentDate = '';
  occupantStatus: 'valid' | 'invalid' | 'expired' = 'invalid';
  occupantMessage = '';

  slideshowFiles: File[] = [];
  slideshowPreviews: string[] = [];

  existingPhotos: string[] = [];
  slideshowId: number | null = null;

  loading = false;
  error: string | null = null;
  message: string | null = null;

  constructor(
    private fb: FormBuilder,
    private slideshowService: SlideshowService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const doc = this.route.snapshot.paramMap.get('document_no');
    if (!doc) {
      this.setInvalidLink('❌ Document number is missing.');
      return;
    }

    this.documentNo = doc;
    this.buildForm();
    this.loadContext();
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      uploader_name: ['', Validators.required]
    });
  }

  private loadContext(): void {
    this.slideshowService.getContext(this.documentNo).subscribe({
      next: (res: any[]) => {
        if (!res.length) {
          this.setInvalidLink('❌ Invalid document link.');
          return;
        }

        const record = res[0];
        this.occupantName = record.occupant ?? record.name1;
        this.intermentDate = record.date_interment;
        this.occupantStatus = 'valid';
        this.uploadForm.enable();

        // Fetch existing slideshow photos
        this.slideshowService.getByDocumentNo(this.documentNo).subscribe({
          next: (slideRes: any) => {
            this.existingPhotos = slideRes?.photo ?? [];
            this.slideshowId = slideRes?.id ?? null;
            this.uploadForm.patchValue({ uploader_name: slideRes?.uploader_name ?? '' });
          },
          error: () => {
            this.existingPhotos = [];
            this.slideshowId = null;
          }
        });
      },
      error: (err) => {
        if (err.status === 403) {
          this.setInvalidLink('⏳ This link has expired.');
          this.occupantStatus = 'expired';
        } else {
          this.setInvalidLink('⚠️ Invalid or unavailable link.');
        }
      }
    });
  }

  private setInvalidLink(message: string) {
    this.occupantStatus = 'invalid';
    this.occupantMessage = message;
    this.uploadForm.disable();
  }

  onSlideshowFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.slideshowFiles = Array.from(input.files);
    this.slideshowPreviews = [];

    this.slideshowFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.slideshowPreviews.push(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeSelectedFile(index: number): void {
    this.slideshowFiles.splice(index, 1);
    this.slideshowPreviews.splice(index, 1);
  }

  deleteExistingPhoto(photoUrl: string): void {
    if (!this.slideshowId) return;
    if (!confirm('Remove this photo from the slideshow?')) return;

    this.slideshowService.deletePhoto(this.slideshowId, photoUrl).subscribe({
      next: (res: any) => this.existingPhotos = res.photos,
      error: () => this.error = 'Failed to delete photo.'
    });
  }

  submitUpload(): void {
    this.error = null;
    this.message = null;

    if (!this.uploadForm.valid) {
      this.uploadForm.markAllAsTouched();
      this.error = 'Please provide your name.';
      return;
    }

    if (!this.slideshowFiles.length) {
      this.error = 'Please select at least one photo.';
      return;
    }

    const formData = new FormData();
    formData.append('document_no', this.documentNo);
    formData.append('uploader_name', this.uploadForm.value.uploader_name);
    this.slideshowFiles.forEach(file => formData.append('photo[]', file));

    this.loading = true;
    this.slideshowService.uploadSlideshow(formData).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Slideshow photos uploaded successfully.';
        this.slideshowFiles = [];
        this.slideshowPreviews = [];
        this.loadContext();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Upload failed. Please try again.';
      }
    });
  }

  goBackToLanding(): void {
    this.router.navigate(['/interments', this.documentNo]);
  }

  goToReview(): void {
    this.router.navigate(['/intermentsReviewLink', this.documentNo]);
  }
}
