import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // <-- Import CommonModule

import { IntermentsLandingService } from '../../Services/landing/landing';

@Component({
  selector: 'app-interments-landing',
  standalone: true,
  imports: [
    FormsModule,   // For [(ngModel)]
    CommonModule   // For *ngIf, *ngFor
  ],
  templateUrl: './landing.html'
})
export class IntermentsLandingComponent implements OnInit {
  documentNo: string = '';
  occupantStatus: 'valid' | 'wrongLink' | 'expired' | 'none' = 'none';
  occupantMessage: string = '';
  occupantNames: string[] = [];
  intermentDate: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private landingService: IntermentsLandingService
  ) {}

  ngOnInit() {
    const document_no = this.route.snapshot.paramMap.get('document_no');
    if (document_no) {
      this.documentNo = document_no;
      this.checkDocumentLink(document_no);
    }
  }

  checkDocumentLink(document_no: string) {
    this.loading = true;
    this.landingService.getInterment(document_no).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.occupantStatus = 'valid';
        this.occupantNames = res.map((r: any) => r.occupant ?? r.name1);
        this.intermentDate = res[0].date_interment;
      },
      error: (err: any) => { // <-- Type the error
        this.loading = false;
        if (err.status === 404) {
          this.occupantStatus = 'wrongLink';
          this.occupantMessage = '❌ No records found for this document number.';
        } else if (err.status === 403) {
          this.occupantStatus = 'expired';
          this.occupantMessage = '⏳ This link has expired.';
        } else {
          this.occupantStatus = 'wrongLink';
          this.occupantMessage = '⚠️ Invalid record.';
        }
      }
    });
  }

  goToReview() {
    if (this.documentNo.trim()) {
      this.router.navigate(['/intermentsReviewLink', this.documentNo.trim()]);
    } else {
      alert('Please enter a valid Document No.');
    }
  }

  goToUploadPhoto() {
    if (this.documentNo.trim()) {
      this.router.navigate(['/intermentsUploadInterredPhotoLink', this.documentNo.trim()]);
    } else {
      alert('Please enter a valid Document No.');
    }
  }

goToUploadSlideShowPhoto(): void {
 if (this.documentNo.trim()) {
    this.router.navigate(['/slideshow', this.documentNo.trim()]);
  } else {
    window.alert('❌ Please enter a valid Document Number.');
  }
}

}
