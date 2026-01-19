import { Routes } from '@angular/router';
import { UploadReviewComponent } from './Views/upload-review/upload-review';

export const routes: Routes = [
  // Only document number in the URL
  { path: 'upload-review/:occupant', component: UploadReviewComponent },

  
  { path: '**', redirectTo: 'upload-review/12345' }
];
