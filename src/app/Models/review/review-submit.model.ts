export interface ReviewSubmit {
  documentNo: string;

  reviewerName: string;
  contactNumber: string;

  focusQuestion: string;

  others?: string;

  fbScreenshot?: File;
  googleScreenshot?: File;
}
