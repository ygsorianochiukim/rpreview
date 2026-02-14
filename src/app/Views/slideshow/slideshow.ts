import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SlideshowService } from '../../Services/slideshow/slideshow';

@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './slideshow.html',
  styleUrls: ['./slideshow.scss']
})
export class SlideshowComponent implements OnInit {

  readonly BATCH_SIZE = 5;
  readonly MAX_PHOTOS = 50;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png'];

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
  uploading = false;

  error: string | null = null;
  message: string | null = null;

  currentBatch = 0;
  totalBatches = 0;

  constructor(
    private fb: FormBuilder,
    private slideshowService: SlideshowService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {
    const doc = this.route.snapshot.paramMap.get('document_no');

    if (!doc) {
      this.invalidateLink('❌ Document number is missing.', 'invalid');
      return;
    }

    this.documentNo = doc.trim();
    this.buildForm();
    this.loadContext();
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      uploader_name: ['', Validators.required],
      email_add: ['', [Validators.required, Validators.email]]
    });

    this.uploadForm.disable();
  }

  // =========================
  // LOAD DATA
  // =========================

  private loadContext(): void {
    this.slideshowService.getContext(this.documentNo).subscribe({
      next: (records: any[]) => {
        if (!records?.length) {
          this.invalidateLink('❌ Invalid document link.', 'invalid');
          return;
        }

        const record = records[0];

        this.occupantName = record.occupant ?? record.name1 ?? '';
        this.intermentDate = record.date_interment ?? '';

        this.occupantStatus = 'valid';
        this.uploadForm.enable();

        this.loadExistingSlideshow();
      },
      error: (err) => {
        if (err.status === 403) {
          this.invalidateLink('⏳ This link has expired.', 'expired');
        } else {
          this.invalidateLink('⚠️ Invalid or unavailable link.', 'invalid');
        }
      }
    });
  }

  private loadExistingSlideshow(): void {
    this.slideshowService.getByDocumentNo(this.documentNo).subscribe({
      next: (res: any) => {
        this.existingPhotos = res?.photo ?? [];
        this.slideshowId = res?.id ?? null;

        this.uploadForm.patchValue({
          uploader_name: res?.uploader_name ?? '',
          email_add: res?.email_add ?? ''
        });
      },
      error: () => {
        this.existingPhotos = [];
        this.slideshowId = null;
      }
    });
  }

  private invalidateLink(
    message: string,
    status: 'invalid' | 'expired'
  ): void {
    this.occupantStatus = status;
    this.occupantMessage = message;
    this.uploadForm.disable();
  }

  // =========================
  // FILE HANDLING
  // =========================

  onSlideshowFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.error = null;

    const selectedFiles = Array.from(input.files);

    const totalAfterUpload =
      this.existingPhotos.length +
      this.slideshowFiles.length +
      selectedFiles.length;

    if (totalAfterUpload > this.MAX_PHOTOS) {
      this.error = `Maximum ${this.MAX_PHOTOS} photos allowed.`;
      input.value = '';
      return;
    }

    for (const file of selectedFiles) {

      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.error = 'Only JPG and PNG images are allowed.';
        continue;
      }

      this.slideshowFiles.push(file);

      const reader = new FileReader();
      reader.onload = () =>
        this.slideshowPreviews.push(reader.result as string);
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.slideshowFiles.splice(index, 1);
    this.slideshowPreviews.splice(index, 1);
  }

  deleteExistingPhoto(photoUrl: string): void {
    if (!this.slideshowId) return;
    if (!confirm('Remove this photo from the slideshow?')) return;

    this.slideshowService
      .deletePhoto(this.slideshowId, photoUrl)
      .subscribe({
        next: (res: any) => {
          this.existingPhotos = res?.photos ?? [];
        },
        error: () => {
          this.error = 'Failed to delete photo.';
        }
      });
  }

  // =========================
  // UPLOAD
  // =========================

  async submitUpload(): Promise<void> {
    this.error = null;
    this.message = null;

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.error = 'Please complete all required fields correctly.';
      return;
    }

    if (!this.slideshowFiles.length) {
      this.error = 'Please select at least one photo.';
      return;
    }

    const totalPhotos =
      this.existingPhotos.length + this.slideshowFiles.length;

    if (totalPhotos > this.MAX_PHOTOS) {
      this.error = `Maximum ${this.MAX_PHOTOS} photos allowed.`;
      return;
    }

    this.uploading = true;
    this.loading = true;

    const batches: File[][] = [];
    for (let i = 0; i < this.slideshowFiles.length; i += this.BATCH_SIZE) {
      batches.push(
        this.slideshowFiles.slice(i, i + this.BATCH_SIZE)
      );
    }

    this.totalBatches = batches.length;
    this.currentBatch = 0;

    try {
      for (const batch of batches) {
        this.currentBatch++;

        const formData = new FormData();
        formData.append('document_no', this.documentNo);
        formData.append(
          'uploader_name',
          this.uploadForm.get('uploader_name')?.value
        );
        formData.append(
          'email_add',
          this.uploadForm.get('email_add')?.value
        );

        batch.forEach(file =>
          formData.append('photo[]', file)
        );

        await firstValueFrom(
          this.slideshowService.uploadSlideshow(formData)
        );
      }

      this.message = 'All slideshow photos uploaded successfully.';
      this.slideshowFiles = [];
      this.slideshowPreviews = [];

      this.loadExistingSlideshow();

    } catch (err: any) {
      this.error =
        err?.error?.message ||
        'Some uploads failed. Please retry.';
    } finally {
      this.loading = false;
      this.uploading = false;
    }
  }

  // =========================
  // NAVIGATION
  // =========================

  goBackToLanding(): void {
    this.router.navigate(['/interments', this.documentNo]);
  }

  goToReview(): void {
    this.router.navigate([
      '/intermentsReviewLink',
      this.documentNo
    ]);
  }

  goToUploadPhoto(): void {
    if (!this.documentNo) return;

    this.router.navigate([
      '/intermentsUploadInterredPhotoLink',
      this.documentNo
    ]);
  }
}
