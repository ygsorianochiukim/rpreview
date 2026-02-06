import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IntermentPhotoService } from '../../Services/upload/upload';
import { ReviewService } from '../../Services/review/review';
import { ReviewContext } from '../../Models/review/review-context.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-upload-interred-photo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './upload-interred-photo.html',
  styleUrls: ['./upload-interred-photo.scss']
})
export class UploadInterredPhotoComponent implements OnInit {

  uploadForm!: FormGroup;
  existingPhotos: Record<string, any> = {};
  loading = false;
  message: string | null = null;
  error: string | null = null;

  documentNo = '';
  occupantNames: string[] = [];
  intermentDate = '';
  occupantStatus: 'valid' | 'invalid' | 'expired' = 'invalid';
  occupantMessage = '';

  constructor(
    private fb: FormBuilder,
    private intermentPhotoService: IntermentPhotoService,
    private reviewService: ReviewService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const doc = this.route.snapshot.paramMap.get('document_no');
    if (!doc) return this.setInvalidLink('❌ Document number is missing.');
    this.documentNo = doc;
    this.loadIntermentContext();
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      records: this.fb.array([])
    });
  }

  get records(): FormArray {
    return this.uploadForm.get('records') as FormArray;
  }

  private loadIntermentContext(): void {
    this.reviewService.getInterments(this.documentNo).subscribe({
      next: (res: ReviewContext[]) => {
        if (!res.length) return this.setInvalidLink('❌ Interment record not found.');

        this.intermentDate = res[0].date_interment ?? '';
        const now = new Date();
        const expiry = new Date(this.intermentDate);
        if (now > expiry) return this.setInvalidLink('⏳ Link expired', 'expired');

        this.occupantNames = res.map(r => r.occupant ?? r.name1);
        this.buildForm();

        this.occupantNames.forEach(name => {
          this.records.push(this.fb.group({
            occupant_name: [name, Validators.required],
            uploader_name: ['', Validators.required],
            photo: [null],             // for new upload or editing
            preview: [''],             // existing photo URL or base64 preview
            recordId: [null],          // existing photo id
            editing: [false]           // toggle edit mode
          }));
        });

        this.occupantStatus = 'valid';
        this.uploadForm.enable();

        // Load existing photos
        this.intermentPhotoService.getByDocumentNo(this.documentNo).subscribe({
          next: (photos: any[]) => {
            photos.forEach(p => {
              const idx = this.records.controls.findIndex(r => r.value.occupant_name === p.occupant);
              if (idx >= 0) {
                this.records.at(idx).patchValue({
                  preview: p.photo,
                  recordId: p.id
                });
              }
            });
          }
        });
      },
      error: err => this.setInvalidLink(err?.error?.message || '⚠️ Invalid link')
    });
  }

  private setInvalidLink(msg: string, status: 'invalid' | 'expired' = 'invalid') {
    this.occupantMessage = msg;
    this.occupantStatus = status;
    this.uploadForm?.disable();
  }

  toggleEdit(index: number): void {
    const record = this.records.at(index);
    record.patchValue({ editing: true, photo: null });
  }

  onPhotoChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const record = this.records.at(index);
    record.patchValue({ photo: file });

    const reader = new FileReader();
    reader.onload = () => record.patchValue({ preview: reader.result });
    reader.readAsDataURL(file);
  }

  removePhoto(index: number): void {
    const record = this.records.at(index);
    record.patchValue({ photo: null, preview: null, editing: false });
  }

  submitUpload(): void {
    this.error = null;
    this.message = null;

    // Validate uploader names
    let invalid = false;
    this.records.controls.forEach(record => {
      if (!record.value.uploader_name || record.value.uploader_name.trim() === '') {
        record.get('uploader_name')?.setErrors({ required: true });
        invalid = true;
      }
    });
    if (invalid) {
      this.error = 'Please fill in all uploader names.';
      return;
    }

    const newFormData = new FormData();
    const updateCalls: any[] = [];

    this.records.controls.forEach((record, i) => {
      const val = record.value;

      // Existing photo → replace
      if (val.recordId && val.editing && val.photo instanceof File) {
        const fd = new FormData();
        fd.append('photo', val.photo);
        fd.append('uploader_name', val.uploader_name);
        updateCalls.push(this.intermentPhotoService.updatePhoto(val.recordId, fd));
      }

      // New photo
      else if (!val.recordId && val.photo instanceof File) {
        newFormData.append('document_no', this.documentNo);
        newFormData.append(`occupants[${i}][occupant_name]`, val.occupant_name);
        newFormData.append(`occupants[${i}][uploader_name]`, val.uploader_name);
        newFormData.append(`occupants[${i}][photo]`, val.photo);
      }
    });

    if (newFormData.has('occupants[0][occupant_name]')) {
      updateCalls.unshift(this.intermentPhotoService.uploadPhoto(newFormData));
    }

    if (updateCalls.length === 0) {
      this.message = 'No changes to upload.';
      return;
    }

    this.loading = true;
    forkJoin(updateCalls).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'All photos uploaded/updated successfully!';
        this.loadIntermentContext();
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Upload failed.';
      }
    });
  }

  goBackToLanding(): void { this.router.navigate(['/interments', this.documentNo]); }
  goToReview(): void { this.router.navigate(['/intermentsReviewLink', this.documentNo]); }

}
