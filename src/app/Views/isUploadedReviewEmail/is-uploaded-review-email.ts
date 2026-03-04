
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IsUploadReviewEmailService } from '../../Services/isUploadedReviewEmail/is-upload-review-email';
import { IsUploadReviewEmailModel } from '../../Models/isUploadedReviewEmail/uploadedreviewemail';


@Component({
  selector: 'app-is-uploaded-review-email',
  imports: [CommonModule, FormsModule],
  templateUrl: './is-uploaded-review-email.html',
  styleUrl: './is-uploaded-review-email.scss',
})

export class IsUploadedReviewEmail implements OnInit {

  reviews: any[] = [];
  filteredReviews: any[] = [];

  searchText: string = '';

  loading = false;

  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private reviewService: IsUploadReviewEmailService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  /* ===============================
     Load Data
  =============================== */

  loadReviews() {
    this.loading = true;

    this.reviewService.extractReviews()
      .subscribe({
        next: (res: any) => {

          this.reviews = res.data || [];
          this.filteredReviews = this.reviews;

          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  /* ===============================
     Search Filter
  =============================== */

  filterData() {

    this.filteredReviews = this.reviews.filter(item =>
      item.document_no?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.email_add?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.occupant?.toLowerCase().includes(this.searchText.toLowerCase())
    );

    this.currentPage = 1;
  }

  /* ===============================
     Pagination Logic
  =============================== */

  get paginatedReviews() {

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    return this.filteredReviews.slice(start, end);
  }

  nextPage() {

    if (this.currentPage * this.itemsPerPage < this.filteredReviews.length) {
      this.currentPage++;
    }

  }

  prevPage() {

    if (this.currentPage > 1) {
      this.currentPage--;
    }

  }

}