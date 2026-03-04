export interface Review {
  id: number;
  document_no: string;
  reviewer_name: string;
  contact_number: string;
  selected_public_question: string;
  selected_private_question: string;
  private_feedback: string;
  others: string;
  fb_screenshot: string;
  google_screenshot: string;
  submitted_at: string;
  is_valid: number;
}