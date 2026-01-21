import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../Services/review/review';
import { ReviewContext } from '../../Models/review/review-context.model';

@Component({
  selector: 'app-upload-review',
  templateUrl: './upload-review.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class UploadReviewComponent implements OnInit {

  submitted: boolean = false;

  step: number = 1;
  reviewForm!: FormGroup;

  // Public Question
  selectedFocusQuestion: string = '';
  requiredFocusQuestions: string[] = [
    'Which part of the process did Renaissance Park explain clearly?',
    'How did the staff help your family during the service?',
    'What stood out the most about the interment service?',
    'What made Renaissance Park practical or easy for your family?',
    'What gave you peace of mind after the service?'
]
;
  currentIndex: number = 0;
  currentFocusQuestion: string = this.requiredFocusQuestions[0];

  // Private FAQ
  selectedPrivateFaq: string = '';
  requiredPrivateFaqs: string[] = [
    'Which part of the service felt slow or rushed?',
    'When did you feel unsure about what to do next?',
    'What was explained late or not clear?',
    'Was there a time when staff instructions were confusing?',
    'When did your family feel most stressed?',
    'Which rule or requirement was surprising or hard to follow?',
    'Was there anything about the setup, chairs, tents, or sound that could be better?',
    'Looking back, what would have made the service smoother for your family?'
]
;
  privateIndex: number = 0;
  currentPrivateFaq: string = this.requiredPrivateFaqs[0];

  // Step 1 optional FAQ arrays
  optionalFocusFaq: string[] = [];
  showOptionalFaq: boolean = false;

  optionalPrivateFaq: string[] = [];
  showPrivateFaq: boolean = false;

  // STEP 2: Screenshots
  fbFile?: File;
  googleFile?: File;
  fbPreview: string | null = null;
  googlePreview: string | null = null;

  // Occupant Info
  occupantName: string = '';
  intermentDate: string = '';
  documentNo: string = '';
  occupantStatus: 'valid' | 'wrongLink' | 'expired' = 'valid';
  occupantMessage: string = '';

  // Language
  selectedLanguage: 'en' | 'tl' | 'hil' = 'en';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadIntermentContext();
    this.pickRandomRequiredQuestions();
  }

  buildForm() {
    this.reviewForm = this.fb.group({
      reviewerName: ['', Validators.required],
      contactNumber: ['', Validators.required],
      focusQuestion: [''],
      optionalFocusFaq: this.fb.array([]),
      fbFile: [null],
      googleFile: [null],
      privateFaqAnswer: [''],
      privateFaqSelected: this.fb.array([]),
      privateOthers: ['']
    });
  }

  // Load occupant info
  loadIntermentContext() {
    const occupant = this.route.snapshot.paramMap.get('occupant')!;
    this.reviewService.getInterments(occupant).subscribe(
      (res: ReviewContext[]) => {
        if (res.length > 0) {
          this.occupantName = res[0].occupant;
          this.intermentDate = res[0].date_interment;
          this.documentNo = res[0].documentno;
          this.occupantStatus = 'valid';
          this.reviewForm.enable();
        } else {
          this.occupantStatus = 'wrongLink';
          this.occupantMessage = '❌ The link is invalid or the Interred Name does not exist. The review form is disabled.';
          this.reviewForm.disable();
        }
      },
      (err) => {
        if (err.status === 410) {
          this.occupantStatus = 'expired';
          this.occupantMessage = '⏳ This review link has expired. The form is disabled.';
        } else {
          this.occupantStatus = 'wrongLink';
          this.occupantMessage = '❌ The link is invalid or the Interred Name does not exist. The review form is disabled.';
        }
        this.reviewForm.disable();
      }
    );
  }

  // Randomly pick required questions
  pickRandomRequiredQuestions() {
    // Public Focus Question
    const shuffledFocus = [...this.requiredFocusQuestions].sort(() => 0.5 - Math.random());
    this.currentFocusQuestion = shuffledFocus[0];
    this.selectedFocusQuestion = this.currentFocusQuestion; // pre-select
    this.optionalFocusFaq = shuffledFocus.slice(1);
    this.reviewForm.patchValue({ focusQuestion: this.selectedFocusQuestion });

    // Private FAQ
    const shuffledPrivate = [...this.requiredPrivateFaqs].sort(() => 0.5 - Math.random());
    this.currentPrivateFaq = shuffledPrivate[0];
    this.selectedPrivateFaq = this.currentPrivateFaq; // pre-select
    this.optionalPrivateFaq = shuffledPrivate.slice(1);
    this.reviewForm.patchValue({ privateFaqSelected: [this.selectedPrivateFaq] });
  }

  // Navigate questions
  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.requiredFocusQuestions.length) this.currentIndex = 0;
    this.currentFocusQuestion = this.requiredFocusQuestions[this.currentIndex];
  }

  nextPrivateFaq() {
    this.privateIndex++;
    if (this.privateIndex >= this.requiredPrivateFaqs.length) this.privateIndex = 0;
    this.currentPrivateFaq = this.requiredPrivateFaqs[this.privateIndex];
  }

  selectQuestion(question: string) {
    this.selectedFocusQuestion = question;
    this.reviewForm.patchValue({ focusQuestion: question });
  }

  selectPrivateFaq(question: string) {
    this.selectedPrivateFaq = question;
    this.reviewForm.patchValue({ privateFaqSelected: question });
  }

  // FormArrays
  get optionalFocusFaqArray(): FormArray {
    return this.reviewForm.get('optionalFocusFaq') as FormArray;
  }

  onOptionalFocusChange(event: any) {
    const faq = event.target.value;
    if (event.target.checked) this.optionalFocusFaqArray.push(this.fb.control(faq));
    else {
      const index = this.optionalFocusFaqArray.controls.findIndex(ctrl => ctrl.value === faq);
      if (index >= 0) this.optionalFocusFaqArray.removeAt(index);
    }
  }

  get privateFaqArray(): FormArray {
    return this.reviewForm.get('privateFaqSelected') as FormArray;
  }

  onPrivateFaqChange(event: any) {
    const faq = event.target.value;
    if (event.target.checked) this.privateFaqArray.push(this.fb.control(faq));
    else {
      const index = this.privateFaqArray.controls.findIndex(ctrl => ctrl.value === faq);
      if (index >= 0) this.privateFaqArray.removeAt(index);
    }
  }

  // File uploads
  onFbChange(event: any) {
    this.fbFile = event.target.files[0];
    if (this.fbFile) {
      const reader = new FileReader();
      reader.onload = () => this.fbPreview = reader.result as string;
      reader.readAsDataURL(this.fbFile);
    }
  }

  onGoogleChange(event: any) {
    this.googleFile = event.target.files[0];
    if (this.googleFile) {
      const reader = new FileReader();
      reader.onload = () => this.googlePreview = reader.result as string;
      reader.readAsDataURL(this.googleFile);
    }
  }

  removeFb() { this.fbFile = undefined; this.fbPreview = null; }
  removeGoogle() { this.googleFile = undefined; this.googlePreview = null; }

  // Navigation
  next() { if (this.step < 3) this.step++; }
  back() { if (this.step > 1) this.step--; }

  submitReview() {
    const reviewerName = this.reviewForm.value.reviewerName;
    const contactNumber = this.reviewForm.value.contactNumber;

    if (!reviewerName || !contactNumber) {
      this.reviewForm.get('reviewerName')?.markAsTouched();
      this.reviewForm.get('contactNumber')?.markAsTouched();
      alert('Please fill in your name and contact number.');
      return;
    }

    if (!this.fbFile && !this.googleFile) {
      alert('Please upload at least one screenshot.');
      return;
    }

    if (!this.selectedFocusQuestion) {
      alert('Please select a public question.');
      return;
    }

    if (!this.selectedPrivateFaq) {
      alert('Please select a private question.');
      return;
    }

    const formData = new FormData();
    formData.append('document_no', this.documentNo);
    formData.append('reviewer_name', reviewerName);
    formData.append('contact_number', contactNumber);
    formData.append('selected_public_question', this.selectedFocusQuestion);
    formData.append('selected_private_question', this.selectedPrivateFaq);
    formData.append('public_others', this.optionalFocusFaqArray?.value.join('; ') || '');
    formData.append('private_faq_answer', this.reviewForm.value.privateFaqAnswer || '');
    formData.append('privateOthers', this.reviewForm.value.privateOthers || '');
    if (this.fbFile) formData.append('fb_screenshot', this.fbFile);
    if (this.googleFile) formData.append('google_screenshot', this.googleFile);

    this.reviewService.submitReview(formData).subscribe({
      next: () => { this.submitted = true; },
      error: (err) => {
        const code = err.error?.code;
        switch (code) {
          case 'MAX_REVIEWS': alert('❌ Already reached the maximum number of reviews. Thank you.'); break;
          case 'SCREENSHOT_REQUIRED': alert('📸 Please upload at least one screenshot (Facebook or Google). Thank you.'); break;
          case 'DUPLICATE_REVIEW': alert('⚠️ You have already submitted feedback for this service. Thank you.'); break;
          default: alert(err.error?.message || 'Submission failed. Please try again.');
        }
      }
    });
  }

  // Language microcopy
  getHeaderText() {
    return this.selectedLanguage === 'tl'
      ? 'Pinahahalagahan namin ang iyong puna'
      : this.selectedLanguage === 'hil'
      ? 'Ginatamdan namon ang imo nga feedback'
      : 'We appreciate your feedback';
  }

  getSubHeaderText() {
    return this.selectedLanguage === 'tl'
      ? 'Ilang pamilya ang nag-iiwan ng maikling rekomendasyon sa aming pahina. Maaari ka ring magbahagi ng pribadong puna o alalahanin.'
      : this.selectedLanguage === 'hil'
      ? 'May mga pamilya nga nagabutang sang gamay nga rekomendasyon sa amon nga pahina. Pwede ka man maghatag sang pribado nga feedback.'
      : 'Some families leave a short recommendation on our page. You may also share private feedback or concerns with us.';
  }

}
