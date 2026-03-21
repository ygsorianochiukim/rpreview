import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PhotolinkuploadService } from '../../Services/photolinkupload/photolinkupload';
import { Photolinkupload } from '../../Models/photolinkupload/photolinkupload';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photolinkupload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './photolinkupload.html',
  styleUrls: ['./photolinkupload.scss']
})
export class PhotolinkuploadComponent implements OnInit {
  documentNo = '';
  occupantName: string = '';
  uploadForm!: FormGroup;
  editForm!: FormGroup;

  loading = false;
  message: string | null = null;
  error: string | null = null;

  documentValid = false;
  documentChecked = false;

  savedLinks: Photolinkupload[] = [];
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private photolinkService: PhotolinkuploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const doc = this.route.snapshot.paramMap.get('document_no');
    if (!doc) {
      this.error = 'Document number is required.';
      return;
    }

    this.documentNo = doc;
    this.buildForm();
    this.buildEditForm();
    this.validateDocumentAndLoadData();
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      links: this.fb.array([this.createLinkGroup()])
    });
  }

  private buildEditForm(): void {
    this.editForm = this.fb.group({
      link: ['', [Validators.required, Validators.maxLength(2048)]],
      photographer_name: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  private createLinkGroup(): FormGroup {
    return this.fb.group({
      link: ['', [Validators.required, Validators.maxLength(2048)]],
      photographer_name: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  get links(): FormArray {
    return this.uploadForm.get('links') as FormArray;
  }

  get hasSavedLinks(): boolean {
    return this.savedLinks.length > 0;
  }

  get canUseForm(): boolean {
    return this.documentValid && !this.hasSavedLinks;
  }

  private validateDocumentAndLoadData(): void {
  this.loading = true;
  this.error = null;
  this.message = null;
  this.documentChecked = false;
  this.documentValid = false;

  this.photolinkService.validateDocument(this.documentNo).subscribe({
    next: (res: any) => {
      this.documentValid = true;
      this.documentChecked = true;

      // Extract occupant name
      if (Array.isArray(res) && res.length > 0) {
        this.occupantName = res[0].occupant || '';
      }

      this.fetchSavedLinks();
    },
    error: err => {
      this.documentValid = false;
      this.documentChecked = true;
      this.loading = false;
      this.savedLinks = [];
      this.occupantName = '';

      this.error =
        err?.error?.message || 'Invalid document number. Upload is disabled.';
    }
  });
}

  addLink(): void {
    if (!this.canUseForm) return;
    this.links.push(this.createLinkGroup());
  }

  removeLink(index: number): void {
    if (!this.canUseForm) return;

    if (this.links.length > 1) {
      this.links.removeAt(index);
    }
  }

  submit(): void {
    this.error = null;
    this.message = null;

    if (!this.documentValid) {
      this.error = 'Invalid document number. Cannot save link.';
      return;
    }

    if (this.hasSavedLinks) {
      this.error = 'Link already exists for this document number. Please use edit.';
      return;
    }

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.error = 'Please fill all fields correctly.';
      return;
    }

    const payload = this.links.controls.map(ctrl => ({
      link: ctrl.get('link')?.value,
      photographer_name: ctrl.get('photographer_name')?.value
    }));

    this.loading = true;

    this.photolinkService.storeLinks(this.documentNo, payload).subscribe({
      next: (res: Photolinkupload[]) => {
        this.savedLinks = Array.isArray(res) ? res : [];
        this.message = 'Link saved successfully!';
        this.editingId = null;
        this.buildForm();
      },
      error: err => {
        this.error = err?.error?.message || 'Failed to save link.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  fetchSavedLinks(): void {
    this.photolinkService.getLinks(this.documentNo).subscribe({
      next: (res: Photolinkupload[]) => {
        this.savedLinks = Array.isArray(res) ? res : [];
      },
      error: err => {
        console.error('Failed to fetch saved link:', err);
        this.savedLinks = [];
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  startEdit(item: Photolinkupload): void {
    if (!this.documentValid || !this.hasSavedLinks) return;

    this.editingId = item.id ?? null;
    this.editForm.patchValue({
      link: item.link,
      photographer_name: item.photographer_name || ''
    });

    this.message = null;
    this.error = null;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm.reset();
  }

  saveEdit(item: Photolinkupload): void {
    this.error = null;
    this.message = null;

    if (!this.documentValid) {
      this.error = 'Invalid document number. Cannot update link.';
      return;
    }

    if (!item.id) {
      this.error = 'Invalid record ID.';
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.error = 'Please fill all edit fields correctly.';
      return;
    }

    this.loading = true;

    this.photolinkService.updateLink(item.id, {
      link: this.editForm.value.link,
      photographer_name: this.editForm.value.photographer_name
    }).subscribe({
      next: (res: Photolinkupload) => {
        const index = this.savedLinks.findIndex(x => x.id === item.id);
        if (index !== -1) {
          this.savedLinks[index] = res;
        }
        this.message = 'Link updated successfully!';
        this.cancelEdit();
      },
      error: err => {
        this.error = err?.error?.message || 'Failed to update link.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  trackByLink(index: number, item: Photolinkupload): number | string {
    return item.id ?? item.link ?? index;
  }

  goBack(): void {
    this.router.navigate(['/interments', this.documentNo]);
  }
}