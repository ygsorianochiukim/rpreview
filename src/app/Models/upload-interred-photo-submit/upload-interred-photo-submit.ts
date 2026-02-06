export interface UploadInterredPhotoSubmit {
  document_no: string;           // comes from the URL / link
  uploader_name: string;         // required
  photo: File;                   // Lapida photo
  slideshow_photos?: File[];     // optional, up to 10 files
}
