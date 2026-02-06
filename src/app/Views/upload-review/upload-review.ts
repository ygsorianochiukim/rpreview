import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../Services/review/review';
import { ReviewContext } from '../../Models/review/review-context.model';

@Component({
  selector: 'app-upload-review',
  templateUrl: './upload-review.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class UploadReviewComponent implements OnInit {

  /** FORM & SUBMISSION */
  reviewForm!: FormGroup;
  submitted: boolean = false;
  step: number = 1;

  /** DOCUMENT & OCCUPANT INFO */
  documentNo: string = '';
  intermentDate: string = '';
  occupantName: string = '';
  occupantNames: string[] = [];
  occupantStatus: 'valid' | 'wrongLink' | 'expired' = 'wrongLink';
  occupantMessage: string = '';

  /** PUBLIC QUESTIONS */
  selectedFocusQuestion: string = '';
  requiredFocusQuestions: string[] = [
    'Which part of the process did Renaissance Park explain clearly?',
    'How did the staff help your family during the service?',
    'What stood out the most about the interment service?',
    'What made Renaissance Park practical or easy for your family?',
    'What gave you peace of mind after the service?'
  ];
  currentIndex: number = 0;
  currentFocusQuestion: string = this.requiredFocusQuestions[0];
  optionalFocusFaq: string[] = [];
  showOptionalFaq: boolean = false;

  /** PRIVATE FAQ */
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
  ];
  privateIndex: number = 0;
  currentPrivateFaq: string = this.requiredPrivateFaqs[0];
  optionalPrivateFaq: string[] = [];
  showPrivateFaq: boolean = false;

  /** FILES */
  fbFile?: File;
  googleFile?: File;
  fbPreview: string | null = null;
  googlePreview: string | null = null;

  /** LANGUAGE */
  selectedLanguage: 'en' | 'tl' | 'hil' = 'en';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadIntermentContext();
    this.pickRandomRequiredQuestions();
  }

  /** Build Reactive Form */
  private buildForm(): void {
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

  /** Load occupant & interment info */
  private loadIntermentContext(): void {
    const documentNo = this.route.snapshot.paramMap.get('document_no')!;
    this.reviewService.getInterments(documentNo).subscribe(
      (res: ReviewContext[]) => {
        if (res.length > 0) {
          this.documentNo = res[0].documentno;
          this.intermentDate = res[0].date_interment;
          this.occupantNames = res.map(r => r.occupant ?? r.name1);
          this.occupantName = this.occupantNames[0];
          this.occupantStatus = 'valid';
          this.reviewForm.enable();
        } else {
          this.setInvalidLink('❌ The link is invalid or the Interred Name does not exist.');
        }
      },
      (err) => {
        if (err.status === 403) {
          this.setInvalidLink('⏳ This review link has expired.');
          this.occupantStatus = 'expired';
        } else {
          this.setInvalidLink('⚠️ No valid record found. The review form is disabled.');
        }
        this.reviewForm.disable();
      }
    );
  }

  /** Set invalid link state */
  private setInvalidLink(message: string) {
    this.occupantStatus = 'wrongLink';
    this.occupantMessage = message;
  }

  /** Randomize required questions */
  private pickRandomRequiredQuestions(): void {
    // Public Questions
    const shuffledFocus = [...this.requiredFocusQuestions].sort(() => 0.5 - Math.random());
    this.currentFocusQuestion = shuffledFocus[0];
    this.selectedFocusQuestion = this.currentFocusQuestion;
    this.optionalFocusFaq = shuffledFocus.slice(1);
    this.reviewForm.patchValue({ focusQuestion: this.selectedFocusQuestion });

    // Private Questions
    const shuffledPrivate = [...this.requiredPrivateFaqs].sort(() => 0.5 - Math.random());
    this.currentPrivateFaq = shuffledPrivate[0];
    this.selectedPrivateFaq = this.currentPrivateFaq;
    this.optionalPrivateFaq = shuffledPrivate.slice(1);
    this.reviewForm.patchValue({ privateFaqSelected: [this.selectedPrivateFaq] });
  }

  /** Navigate public & private questions */
  nextQuestion(): void {
    this.currentIndex = (this.currentIndex + 1) % this.requiredFocusQuestions.length;
    this.currentFocusQuestion = this.requiredFocusQuestions[this.currentIndex];
  }

  nextPrivateFaq(): void {
    this.privateIndex = (this.privateIndex + 1) % this.requiredPrivateFaqs.length;
    this.currentPrivateFaq = this.requiredPrivateFaqs[this.privateIndex];
  }

  selectQuestion(question: string): void {
    this.selectedFocusQuestion = question;
    this.reviewForm.patchValue({ focusQuestion: question });
  }

  selectPrivateFaq(question: string): void {
    this.selectedPrivateFaq = question;
    this.reviewForm.patchValue({ privateFaqSelected: question });
  }

  /** FormArrays helpers */
  get optionalFocusFaqArray(): FormArray { return this.reviewForm.get('optionalFocusFaq') as FormArray; }
  get privateFaqArray(): FormArray { return this.reviewForm.get('privateFaqSelected') as FormArray; }

  onOptionalFocusChange(event: any): void {
    const faq = event.target.value;
    if (event.target.checked) this.optionalFocusFaqArray.push(this.fb.control(faq));
    else {
      const index = this.optionalFocusFaqArray.controls.findIndex(c => c.value === faq);
      if (index >= 0) this.optionalFocusFaqArray.removeAt(index);
    }
  }

  onPrivateFaqChange(event: any): void {
    const faq = event.target.value;
    if (event.target.checked) this.privateFaqArray.push(this.fb.control(faq));
    else {
      const index = this.privateFaqArray.controls.findIndex(c => c.value === faq);
      if (index >= 0) this.privateFaqArray.removeAt(index);
    }
  }

  /** File uploads */
  onFbChange(event: any): void {
    this.fbFile = event.target.files[0];
    if (this.fbFile) {
      const reader = new FileReader();
      reader.onload = () => this.fbPreview = reader.result as string;
      reader.readAsDataURL(this.fbFile);
    }
  }

  onGoogleChange(event: any): void {
    this.googleFile = event.target.files[0];
    if (this.googleFile) {
      const reader = new FileReader();
      reader.onload = () => this.googlePreview = reader.result as string;
      reader.readAsDataURL(this.googleFile);
    }
  }

  removeFb(): void { this.fbFile = undefined; this.fbPreview = null; }
  removeGoogle(): void { this.googleFile = undefined; this.googlePreview = null; }

  /** Navigation */
  next(): void { if (this.step < 3) this.step++; }
  back(): void { if (this.step > 1) this.step--; }

  /** Submit Review */
  submitReview(): void {
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

    if (!this.selectedFocusQuestion || !this.selectedPrivateFaq) {
      alert('Please select both public and private questions.');
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
      next: () => this.submitted = true,
      error: (err) => {
        const code = err.error?.code;
        switch (code) {
          case 'MAX_REVIEWS': alert('❌ Maximum reviews reached. Thank you.'); break;
          case 'SCREENSHOT_REQUIRED': alert('📸 Please upload at least one screenshot.'); break;
          case 'DUPLICATE_REVIEW': alert('⚠️ You already submitted feedback.'); break;
          default: alert(err.error?.message || 'Submission failed. Please try again.');
        }
      }
    });
  }

  /** Navigation buttons */
  goBackToHome(): void {
    if (!this.documentNo) return;
    this.router.navigate(['/interments', this.documentNo]); // Adjust route
  }

  goToUploadPhoto() {
     if (!this.documentNo) return;
      this.router.navigate(['/intermentsUploadInterredPhotoLink', this.documentNo.trim()]);
    } 
  

  /** Language helpers */
  getHeaderText(): string {
    return this.selectedLanguage === 'tl'
      ? 'Pinahahalagahan namin ang iyong puna'
      : this.selectedLanguage === 'hil'
      ? 'Ginatamdan namon ang imo nga feedback'
      : 'We appreciate your feedback';
  }

  getSubHeaderText(): string {
    return this.selectedLanguage === 'tl'
      ? 'Ilang pamilya ang nag-iiwan ng maikling rekomendasyon sa aming pahina. Maaari ka ring magbahagi ng pribadong puna o alalahanin.'
      : this.selectedLanguage === 'hil'
      ? 'May mga pamilya nga nagabutang sang gamay nga rekomendasyon sa amon nga pahina. Pwede ka man maghatag sang pribado nga feedback.'
      : 'Some families leave a short recommendation on our page. You may also share private feedback or concerns with us.';
  }

}
