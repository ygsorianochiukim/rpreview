import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../Services/review/review';
import { Review } from '../../Models/review/viewReview';
import { ActivatedRoute, Router } from '@angular/router';
import { IntermentPhotoService } from '../../Services/upload/upload';

import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-view-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule   // ✅ ADD THIS
  ],
  templateUrl: './viewReviews.html'
})



export class ViewReviewComponent implements OnInit {

  constructor(private reviewService: ReviewService,  private router: Router, private http: HttpClient) {}


  zoomImage: string | null = null;

 

  openZoom(image: string | null | undefined) {
    if (!image) return;
    this.zoomImage = image;
  }

  async downloadImage(url: string | null | undefined) {
    if (!url) return;

    try {
      const blob = await firstValueFrom(
        this.http.get(url, { responseType: 'blob' })
      );

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = blobUrl;
      a.download = url.split('/').pop() || 'screenshot.jpg';

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Download failed:', error);
    }
  }

 

  loading: boolean = false;    

  reviews: Review[] = [];
  filteredReviews: Review[] = [];

  selectedReview: Review | null = null;

  searchText: string = '';

  currentPage = 1;
  itemsPerPage = 5;

  

  ngOnInit(): void {
    this.loadReviews();
  }

 loadReviews(): void {
  this.loading = true;

  this.reviewService.getAllReviews().subscribe({
    next: (data) => {
      this.reviews = data;
      this.filteredReviews = data;
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching reviews:', err);
      this.loading = false;
    }
  });
}

  search(): void {
    const keyword = this.searchText.toLowerCase();

    this.filteredReviews = this.reviews.filter(r =>
      r.reviewer_name.toLowerCase().includes(keyword) ||
      r.document_no.toLowerCase().includes(keyword)
    );

    this.currentPage = 1;
  }

  get paginatedReviews(): Review[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReviews.slice(start, start + this.itemsPerPage);
  }

  totalPages(): number {
    return Math.ceil(this.filteredReviews.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  openReview(review: Review): void {
    this.selectedReview = review;
  }

  closeModal(): void {
    this.selectedReview = null;
  }

  getStatusLabel(is_valid: number): string {
    return is_valid === 1 ? 'Approved' : 'Pending';
  }

  getStatusClass(is_valid: number): string {
    return is_valid === 1 ? 'bg-success' : 'bg-warning text-dark';
  }

    goToUploadPhoto() {
      this.router.navigate(['/lapidaDashboard']);
    } 
}