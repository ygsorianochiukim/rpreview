import { Routes } from '@angular/router';
import { UploadReviewComponent } from './Views/upload-review/upload-review';

export const routes: Routes = [
  // Only document number in the URL
  { path: 'intermentsReviewLink/:document_no', component: UploadReviewComponent },

  
  { path: '**', redirectTo: 'intermentsReviewLink/12345' }
];
