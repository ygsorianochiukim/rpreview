export interface SlideshowSubmit {
  /** Document number from the URL/link */
  document_no: string;

  /** Name of the occupant for whom the photos are being uploaded */
  occupant_name: string;

  /** Name of the person uploading the photos (required) */
  uploader_name: string;

  /** Array of slideshow photos (each file max 10MB) */
  photos: File[];
}
