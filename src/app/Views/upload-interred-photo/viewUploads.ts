import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../Services/review/review';

import { IntermentPhotoService } from '../../Services/upload/upload';
import { UploadInterredPhotoContext } from '../../Models/upload-interred-photo-context/upload-interred-photo-context';

@Component({
  selector: 'app-upload-interred-photo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viewUploads.html'
})

export class ViewUploadInterredPhotoComponent implements OnInit {

  photos: UploadInterredPhotoContext[] = [];
  filteredPhotos: UploadInterredPhotoContext[] = [];

  selectedPhoto: UploadInterredPhotoContext | null = null;

  occupantStatus: any;

  searchText = '';

  loading = false;

  currentPage = 1;
  itemsPerPage = 5;

  constructor(private service: IntermentPhotoService, private router: Router,) {}

  ngOnInit(): void {
    this.loadPhotos();
  }

  // =========================
  // Load Data
  // =========================
  loadPhotos(): void {

    this.loading = true;

    this.service.getAll().subscribe({
      next: (res: UploadInterredPhotoContext[]) => {

        this.photos = res || [];
        this.filteredPhotos = [...this.photos];

        this.loading = false;
      },

      error: (err) => {

        console.error('Load photos error:', err);

        this.photos = [];
        this.filteredPhotos = [];

        this.loading = false;
      }
    });
  }

  // =========================
  // Search
  // =========================
  search(): void {

    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) {
      this.filteredPhotos = [...this.photos];
      this.currentPage = 1;
      return;
    }

    this.filteredPhotos = this.photos.filter(p =>
      p.document_no?.toLowerCase().includes(keyword) ||
      p.occupant?.toLowerCase().includes(keyword)
    );

    this.currentPage = 1;
  }

  // =========================
  // Pagination
  // =========================
  get paginatedPhotos(): UploadInterredPhotoContext[] {

    const start = (this.currentPage - 1) * this.itemsPerPage;

    return this.filteredPhotos.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredPhotos.length / this.itemsPerPage)
    );
  }

  changePage(page: number): void {

    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  // =========================
  // Modal Controls
  // =========================
  openPhoto(photo: UploadInterredPhotoContext): void {
    this.selectedPhoto = photo;
  }

  closeModal(): void {
    this.selectedPhoto = null;
  }

  // =========================
  // Status Helpers
  // =========================
  getStatusLabel(is_valid?: number): string {
    return is_valid === 1 ? 'Approved' : 'Pending';
  }

  getStatusClass(is_valid?: number): string {
    return is_valid === 1
      ? 'bg-green-500 text-white'
      : 'bg-yellow-400 text-black';
  }

    goToReviews() {
      this.router.navigate(['/allReviews']);
    } 
}