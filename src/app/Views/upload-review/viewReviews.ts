
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../Services/review/review';
import { Review } from '../../Models/review/viewReview';
import { ActivatedRoute, Router } from '@angular/router';
import { IntermentPhotoService } from '../../Services/upload/upload';
@Component({
  selector: 'app-view-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule   // ✅ ADD THIS
  ],
  templateUrl: './viewReviews.html'
})

export class ViewReviewComponent implements OnInit {

  loading: boolean = false;    

  reviews: Review[] = [];
  filteredReviews: Review[] = [];

  selectedReview: Review | null = null;

  searchText: string = '';

  currentPage = 1;
  itemsPerPage = 5;

  constructor(private reviewService: ReviewService,  private router: Router,) {}

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