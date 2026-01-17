import { Routes } from '@angular/router';
import { UploadReviewComponent } from './Views/upload-review/upload-review';

export const routes: Routes = [
  // Only document number in the URL
  { path: 'upload-review/:documentno', component: UploadReviewComponent },

  // Optional default route (replace 12345 with a valid document number from your DB)
  { path: '**', redirectTo: 'upload-review/12345' }
];
