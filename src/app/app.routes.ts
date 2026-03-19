import { Routes } from '@angular/router';
import { UploadReviewComponent } from './Views/upload-review/upload-review';
import { ViewReviewComponent } from './Views/upload-review/viewReviews';
import { ViewUploadInterredPhotoComponent } from './Views/upload-interred-photo/viewUploads';
import { UploadInterredPhotoComponent } from './Views/upload-interred-photo/upload-interred-photo';
import { IntermentsLandingComponent } from './Views/interments-landing/landing';
import { SlideshowComponent } from './Views/slideshow/slideshow';
import { IsUploadedReviewEmail } from './Views/isUploadedReviewEmail/is-uploaded-review-email';
import { PhotolinkuploadComponent } from './Views/photolinkupload/photolinkupload';


export const routes: Routes = [
  // Landing page with optional document number in URL
  { path: 'interments', component: IntermentsLandingComponent },
  { path: 'interments/:document_no', component: IntermentsLandingComponent },

  // Review route
  { path: 'intermentsReviewLink/:document_no', component: UploadReviewComponent },

  // Upload interred photo route
  // { path: 'intermentsUploadInterredPhotoLink/:document_no', component: UploadInterredPhotoComponent },

  { path: 'intermentsUploadInterredPhotoLink_ForPost/:document_no', component: UploadInterredPhotoComponent },

  { path: 'isReviewedEmail', component: IsUploadedReviewEmail },

  { path: 'allReviews', component: ViewReviewComponent },

  { path: 'lapidaDashboard', component: ViewUploadInterredPhotoComponent },


  //intermentsUploadInterredPhotoLink_ForPost
  
  // Slideshow upload route
  { path: 'slideshow/:document_no', component: SlideshowComponent },

  { path: 'photolinkupload/:document_no', component: PhotolinkuploadComponent },

  // Wildcard: redirect to landing page
  { path: '**', redirectTo: 'interments', pathMatch: 'full' }
];


