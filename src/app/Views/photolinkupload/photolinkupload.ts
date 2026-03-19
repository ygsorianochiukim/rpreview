import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
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
  uploadForm!: FormGroup;
  loading = false;
  message: string | null = null;
  error: string | null = null;

  // Newly saved links
  savedLinks: Photolinkupload[] = [];

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
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      links: this.fb.array([this.fb.control('', [Validators.required, Validators.maxLength(500)])])
    });
  }

  get links(): FormArray {
    return this.uploadForm.get('links') as FormArray;
  }

  addLink(): void {
    this.links.push(this.fb.control('', [Validators.required, Validators.maxLength(500)]));
  }

  removeLink(index: number): void {
    this.links.removeAt(index);
  }

  submit(): void {
    this.error = null;
    this.message = null;

    if (this.uploadForm.invalid) {
      this.error = 'Please fill all links correctly.';
      return;
    }

    const linksArray = this.links.controls.map(ctrl => ctrl.value);

    this.loading = true;
    this.photolinkService.storeLinks(this.documentNo, linksArray).subscribe({
      next: (res: Photolinkupload[]) => {
        this.savedLinks = res; // show newly saved links
        this.message = 'Links saved successfully!';
        this.uploadForm.reset();
        this.buildForm();
      },
      error: err => this.error = err?.error?.message || 'Failed to save links.',
      complete: () => this.loading = false
    });
  }

  goBack(): void {
    this.router.navigate(['/interments', this.documentNo]);
  }
}