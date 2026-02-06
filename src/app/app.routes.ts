import { Routes } from '@angular/router';
import { UploadReviewComponent } from './Views/upload-review/upload-review';
import { UploadInterredPhotoComponent } from './Views/upload-interred-photo/upload-interred-photo';
import { IntermentsLandingComponent } from './Views/interments-landing/landing';
import { SlideshowComponent } from './Views/slideshow/slideshow';

export const routes: Routes = [
  // Landing page with optional document number in URL
  { path: 'interments', component: IntermentsLandingComponent },
  { path: 'interments/:document_no', component: IntermentsLandingComponent },

  // Review route
  { path: 'intermentsReviewLink/:document_no', component: UploadReviewComponent },

  // Upload interred photo route
  { path: 'intermentsUploadInterredPhotoLink/:document_no', component: UploadInterredPhotoComponent },

  // Slideshow upload route
  { path: 'slideshow/for-slide-show/:document_no', component: SlideshowComponent },

  // Wildcard: redirect to landing page
  { path: '**', redirectTo: 'interments', pathMatch: 'full' }
];


