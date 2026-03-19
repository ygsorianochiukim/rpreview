import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SlideshowService } from '../../Services/slideshow/slideshow';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

import { ChangeDetectorRef } from '@angular/core';

export interface SlideshowImage {
  file: File;
  preview: string;
  rotation: number;
  needsCrop?: boolean; 
  needsRotation?: boolean;
}



@Component({
  selector: 'app-slideshow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageCropperComponent],
  templateUrl: './slideshow.html',
  styleUrls: ['./slideshow.scss']
})
export class SlideshowComponent implements OnInit {

  rotatedImageBase64?: string;


private lightBrownBorderCache: HTMLImageElement | undefined;

// When you load it in onSlideshowFilesChange:

  isEditingExisting: boolean = false;
  editingIndex: number = -1; 


 

  showCropModal: boolean = false;
  fileToCrop: File | undefined;
  private cropResolve!: (value: File | PromiseLike<File>) => void;
  private currentCroppedBlob: Blob | null = null;

  uploadProgress = 0;
  readonly BATCH_SIZE = 5;
  readonly MAX_PHOTOS = 50;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  uploadForm!: FormGroup;

  documentNo = '';
  occupantName = '';
  intermentDate = '';
  occupantStatus: 'valid' | 'invalid' | 'expired' = 'invalid';
  occupantMessage = '';

  slideshowImages: SlideshowImage[] = [];
  existingPhotos: string[] = [];
  slideshowId: number | null = null;

  loading = false;
  uploading = false;
  error: string | null = null;
  message: string | null = null;

// Add to SlideshowComponent class
isProcessing: boolean = false;

processingProgress: number = 0;


  readonly BORDER_IMAGE_FILE_1 = '/lightbrown.PNG';
  readonly BORDER_IMAGE_FILE_2 = '/gold.PNG';

  constructor(
    private fb: FormBuilder,
    private slideshowService: SlideshowService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}



  // Add this helper method to your component
isProportional(img: { width: number, height: number }): boolean {
  const ratio = img.width / img.height;
  
  // Define your allowed aspect ratios
  const allowedRatios = [1.5, 1.33, 1.66]; // 6:4, 4:3, 5:3
  
  // Check if current ratio is within 0.1 of any allowed ratio
  return allowedRatios.some(allowed => Math.abs(ratio - allowed) < 0.1);
}

  ngOnInit(): void {
    const doc = this.route.snapshot.paramMap.get('document_no');
    if (!doc) {
      this.invalidateLink('❌ Document number is missing.', 'invalid');
      return;
    }
    this.documentNo = doc.trim();
    this.buildForm();
    this.loadContext();
  }

  private buildForm(): void {
    this.uploadForm = this.fb.group({
      uploader_name: ['', Validators.required],
      email_add: ['', [Validators.required, Validators.email]]
    });
    this.uploadForm.disable();
  }

  private loadContext(): void {
    this.slideshowService.getContext(this.documentNo).subscribe({
      next: (records: any[]) => {
        const record = records[0];
        this.occupantName = record.occupant ?? record.name1 ?? '';
        this.intermentDate = record.date_interment ?? '';
        this.occupantStatus = 'valid';
        this.uploadForm.enable();
        this.loadExistingSlideshow();
      },
      error: (err) => {
        if (err.status === 403) {
          this.invalidateLink('⏳ This link has expired.', 'expired');
        } else {
          this.invalidateLink('⚠️ Invalid or unavailable link.', 'invalid');
        }
      }
    });
  }

  private loadExistingSlideshow(): void {
    this.slideshowService.getByDocumentNo(this.documentNo).subscribe({
      next: (res: any) => {
        this.existingPhotos = res?.photo ?? [];
        this.slideshowId = res?.id ?? null;
        this.uploadForm.patchValue({
          uploader_name: res?.uploader_name ?? '',
          email_add: res?.email_add ?? ''
        });
      },
      error: () => {
        this.existingPhotos = [];
        this.slideshowId = null;
      }
    });
  }

  private invalidateLink(message: string, status: 'invalid' | 'expired'): void {
    this.occupantStatus = status;
    this.occupantMessage = message;
    this.uploadForm.disable();
  }

 

private triggerManualCrop(file: File): Promise<File> {
  return new Promise((resolve) => {
    this.fileToCrop = file;
    this.showCropModal = true;
    this.cropResolve = resolve;
  });
}

// Handler for the image-cropper output
onImageCropped(event: ImageCroppedEvent) {
  this.currentCroppedBlob = event.blob || null;
}

transform: { rotate: number; scale: number; flipH: boolean; flipV: boolean } = {
  rotate: 0,
  scale: 1,
  flipH: false,
  flipV: false
};


async confirmCrop() {
  const img = this.slideshowImages[this.currentIndex];
  const file = this.fileToCrop!;

  // Cropper will give us the rotated/cropped blob
  const croppedFile = new File([this.currentCroppedBlob!], file.name, { type: 'image/jpeg' });

  // Update slideshow
  img.file = croppedFile;
  img.preview = await this.generatePreview(croppedFile);
  img.rotation = 0;       // rotation already applied in canvas
  img.needsCrop = false;
  img.needsRotation = false;

  // Close crop modal
  this.showCropModal = false;
  this.currentIndex = -1;

  // Reset transform fully
  this.transform = { rotate: 0, scale: 1, flipH: false, flipV: false };
}
private generatePreviewFromImage(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const MAX_SIZE = 500; // Limits preview to 500px width/height
  
  let width = img.width;
  let height = img.height;

  // Scale down while maintaining aspect ratio
  if (width > height) {
    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
  } else {
    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, width, height);

  // Return a compressed JPEG data URL
  return canvas.toDataURL('image/jpeg', 0.8);
}



async onSlideshowFilesChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  if (!this.uploadForm) {
    this.error = 'Form not initialized.';
    return;
  }

  this.error = null;
  this.isProcessing = true;
  this.processingProgress = 0;

  const availableSlots = this.MAX_PHOTOS - (this.existingPhotos.length + this.slideshowImages.length);
  const filesToProcess = Array.from(input.files).slice(0, availableSlots);
  const totalFiles = filesToProcess.length;
  let finishedCount = 0;

  if (totalFiles === 0) {
    this.isProcessing = false;
    return;
  }

  try {
    const processingPromises = filesToProcess.map(async (file) => {
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        finishedCount++;
        return null;
      }

      try {
        // ✅ Resize for AI (smaller) and preview/upload (larger)
        const resizedForAI = await this.resizeFile(file, 768);
        const resizedForPreview = await this.resizeFile(file, 2048);

        // ✅ Send smaller version to AI webhook
        const formData = new FormData();
        formData.append('photo[]', resizedForAI);

        const response = await firstValueFrom(this.slideshowService.check_orient(formData));
        const responseData = Array.isArray(response) ? response[0] : response;
        const result = responseData?.body ? responseData.body : responseData;

        // ✅ Debug logging
        console.group(`📸 Webhook Response: ${file.name}`);
        console.log('Raw Response:', response);
        console.log('Parsed ResponseData:', responseData);
        console.log('Final Result:', result);
        console.log('Autodelete:', result?.autodelete);
        console.log('Upright:', result?.upright);
        console.groupEnd();

        // ❌ Reject bad image
        if (result && Number(result.autodelete) === 1) {
          console.warn(`File ${file.name} rejected.`);
          return null;
        }

        // ✅ Load preview from slightly larger resized version
        const img = await this.fileToImage(resizedForPreview);
        const preview = this.generatePreviewFromImage(img);

        // ✅ Crop logic
        const needsCrop = this.checkIfNeedsCrop(img.width, img.height);

        // ✅ Rotation logic from AI
        const needsRotation = result && Number(result.upright) === 0;

        return {
          file: resizedForPreview, // use slightly resized file for upload & preview
          preview,
          rotation: 0,
          needsCrop,
          needsRotation
        } as SlideshowImage;

      } catch (err) {
        console.error(`Processing failed for ${file.name}:`, err);
        return null;
      } finally {
        finishedCount++;
        this.processingProgress = Math.round((finishedCount / totalFiles) * 100);
      }
    });

    const results = await Promise.all(processingPromises);
    const validResults = results.filter((f): f is SlideshowImage => f !== null);
    this.slideshowImages.push(...validResults);

    this.cd.detectChanges();

  } catch (err) {
    this.error = 'An error occurred while processing your photos.';
  } finally {
    this.isProcessing = false;
    input.value = '';
  }
}

// ✅ Helper: Resize image to max dimension while keeping aspect ratio
private resizeFile(file: File, maxDimension: number): Promise<File> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await this.fileToImage(file);
      let { width, height } = img;

      const scale = Math.min(maxDimension / width, maxDimension / height, 1);
      width *= scale;
      height *= scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not available');

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return reject('Failed to create blob');
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type, 0.9);

    } catch (err) {
      reject(err);
    }
  });
}

async addCustomBorderToImage(file: File, borderImg: HTMLImageElement): Promise<File> {
  const mainImage = await this.fileToImage(file);

  const maxWidth = 768;
  const maxHeight = 624;
  const scale = Math.min(maxWidth / mainImage.width, maxHeight / mainImage.height, 1);
  const targetWidth = mainImage.width * scale;
  const targetHeight = mainImage.height * scale;

  const borderThickness = 5;
  const gap = 5;
  const offset = borderThickness + gap;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas Context Error');

  canvas.width = targetWidth + (offset * 2);
  canvas.height = targetHeight + (offset * 2);

  // 1. Fill entire canvas with gap/background color
  ctx.fillStyle = '#EEDC82';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw the main image once
  ctx.drawImage(mainImage, offset, offset, targetWidth, targetHeight);

  // 3. Optimized Border: Create a pattern and fill the frame
  // We define the border as a repeat pattern
  const pattern = ctx.createPattern(borderImg, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    
    // Draw only the border areas using a single 'fill' command
    // Top & Bottom strips
    ctx.fillRect(0, 0, canvas.width, borderThickness);
    ctx.fillRect(0, canvas.height - borderThickness, canvas.width, borderThickness);
    
    // Left & Right strips
    ctx.fillRect(0, borderThickness, borderThickness, canvas.height - (borderThickness * 2));
    ctx.fillRect(canvas.width - borderThickness, borderThickness, borderThickness, canvas.height - (borderThickness * 2));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject('Blob creation failed');
      resolve(new File([blob], file.name, { type: file.type }));
    }, file.type);
  });
}

private fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

 
async generatePreview(file: File): Promise<string> {
  // 1. Use your existing fileToImage helper to load the File as an HTMLImageElement
  const img = await this.fileToImage(file);
  
  // 2. Setup canvas
  const canvas = document.createElement('canvas');
  const MAX_SIZE = 500;
  let width = img.width;
  let height = img.height;

  // 3. Maintain aspect ratio while resizing
  if (width > height) {
    if (width > MAX_SIZE) {
      height *= MAX_SIZE / width;
      width = MAX_SIZE;
    }
  } else {
    if (height > MAX_SIZE) {
      width *= MAX_SIZE / height;
      height = MAX_SIZE;
    }
  }

  // 4. Draw to canvas and return compressed data URL
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Return at 80% quality to further reduce memory footprint
  return canvas.toDataURL('image/jpeg', 0.8);
}

  private loadImageFromPath(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = path;
    });
  }

  removeSelectedFile(index: number): void {
    this.slideshowImages.splice(index, 1);
  }

  deleteExistingPhoto(photoUrl: string): void {
    if (!this.slideshowId) return;
    if (!confirm('Remove this photo from the slideshow?')) return;

    this.slideshowService.deletePhoto(this.slideshowId, photoUrl).subscribe({
      next: (res: any) => {
        this.existingPhotos = res?.photos ?? [];
      },
      error: () => {
        this.error = 'Failed to delete photo.';
      }
    });
  }

  // =========================
  // SUBMIT UPLOAD
  // =========================
  async submitUpload(): Promise<void> {
    this.error = null;
    this.message = null;
    this.uploadProgress = 0;

    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.error = 'Please complete all required fields correctly.';
      return;
    }

    this.uploading = true;
    this.loading = true;

    try {
      const goldBorder = await this.loadImageFromPath(this.BORDER_IMAGE_FILE_2);
      const totalItems = this.slideshowImages.length;
      const totalBatches = Math.ceil(totalItems / this.BATCH_SIZE);

      let processedCount = 0;
      let uploadedCount = 0;

      for (let i = 0; i < totalItems; i += this.BATCH_SIZE) {
        const batchItems = this.slideshowImages.slice(i, i + this.BATCH_SIZE);

        const processedFiles = await Promise.all(
          batchItems.map(async img => {
            const file = await this.addCustomBorderToImage(img.file, goldBorder);
            processedCount++;
            this.uploadProgress = Math.round((processedCount / totalItems) * 50);
            return file;
          })
        );

        const formData = new FormData();
        formData.append('document_no', this.documentNo);
        formData.append('uploader_name', this.uploadForm.get('uploader_name')?.value!);
        formData.append('email_add', this.uploadForm.get('email_add')?.value!);
        processedFiles.forEach(file => formData.append('photo[]', file));

        await firstValueFrom(this.slideshowService.uploadSlideshow(formData));

        uploadedCount++;
        this.uploadProgress = 50 + Math.round((uploadedCount / totalBatches) * 50);
      }

      this.message = 'Upload successful.';
      this.slideshowImages = [];
      this.loadExistingSlideshow();

    } catch (err) {
      this.error = 'Upload failed. Please retry.';
    } finally {
      this.loading = false;
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }

  // =========================
  // NAVIGATION
  // =========================
  goBackToLanding(): void {
    this.router.navigate(['/interments', this.documentNo]);
  }

  goToReview(): void {
    this.router.navigate(['/intermentsReviewLink', this.documentNo]);
  }

  goToUploadPhoto(): void {
    if (!this.documentNo) return;
    this.router.navigate(['/intermentsUploadInterredPhotoLink', this.documentNo]);
  }



private fileToRotatedCanvas(file: File, rotation: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        resolve(canvas);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}



// Modal-only state (per open)
currentIndex: number = -1;


async requestManualCrop(index: number) {
  const currentImage = this.slideshowImages[index];
  if (!currentImage) return;

  this.isEditingExisting = true;
  this.editingIndex = index;
  this.currentIndex = index;

  // Keep rotation state for cropper UI
  this.transform = { rotate: currentImage.rotation || 0, scale: 1, flipH: false, flipV: false };

  // Load image
  const img = await this.fileToImage(currentImage.file);

  // Downscale for cropper modal
  const MAX_UI_SIZE = 800;
  let w = img.width, h = img.height;
  if (w > MAX_UI_SIZE || h > MAX_UI_SIZE) {
    const scale = MAX_UI_SIZE / Math.max(w, h);
    w *= scale;
    h *= scale;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Apply existing rotation visually in the cropper
  ctx.translate(w / 2, h / 2);
  ctx.rotate((this.transform.rotate * Math.PI) / 180);
  ctx.drawImage(img, -img.width * (w / img.width) / 2, -img.height * (h / img.height) / 2, w, h);

  // Convert to blob and pass to cropper
  canvas.toBlob(blob => {
    if (blob) {
      this.fileToCrop = new File([blob], currentImage.file.name, { type: 'image/jpeg' });
      this.showCropModal = true;
    }
  }, 'image/jpeg', 0.9);
}

resetImageState(index: number) {
  const img = this.slideshowImages[index];
  img.rotation = 0;
  img.needsRotation = false;
  img.needsCrop = false;
}



checkIfNeedsCrop(width: number, height: number): boolean {
  const ratio = width / height;

  // Horizontal Ratios (Landscape)
  const landscapeRatios = [1.25, 1.33, 1.5, 1.66, 1.75, 1.78, 0.8, 0.75, 0.67];
  
  // "Tall but not too slim" Ratios (Portrait)
  // 0.8  = 4:5 (The "Sturdy" Tall)
  // 0.75 = 3:4 (The "Classic" Tall)
  // 0.67 = 2:3 (The "Elegant" Tall)
  const portraitRatios = [0.8, 0.75, 0.67, 1.25, 1.33, 1.5, 1.66, 1.75, 1.78];

  const allowedRatios = [...landscapeRatios, ...portraitRatios];
  const tolerance = 0.1; 

  // Returns true if the image ratio is NOT close to any allowed ratios
  return !allowedRatios.some(targetRatio => Math.abs(ratio - targetRatio) < tolerance);
}

async onCropDone(index: number, croppedCanvas: HTMLCanvasElement) {
  const img = this.slideshowImages[index];

  // Convert canvas → blob → file
  const blob = await new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Crop failed'));
    }, 'image/jpeg');
  });

  img.file = new File([blob], img.file.name, { type: 'image/jpeg' });
  img.preview = croppedCanvas.toDataURL('image/jpeg', 0.85);

  //  Recalculate crop need
  img.needsCrop = this.checkIfNeedsCrop(
    croppedCanvas.width,
    croppedCanvas.height
  );

  // If already correct → remove warning
  if (!img.needsCrop) {
    console.log('✅ Crop valid — hiding warning');
  }
}

async rotateImage(angle: number) {
  this.transform = {
    ...this.transform,
    rotate: (this.transform.rotate + angle + 360) % 360
  };

  // Optional: update rotated preview for cropper
  const file = this.slideshowImages[this.currentIndex].file;
  this.rotatedImageBase64 = await this.getRotatedImage(file, this.transform.rotate);
}

private async getRotatedImage(file: File, angle: number): Promise<string> {
  const img = await this.fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Calculate rotated dimensions
  const radians = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const newWidth = img.width * cos + img.height * sin;
  const newHeight = img.width * sin + img.height * cos;

  canvas.width = newWidth;
  canvas.height = newHeight;

  // Center image
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL('image/jpeg', 0.9);
}

}