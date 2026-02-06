import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SlideshowService {

  private readonly apiUrl = environment.apiUrl;
  private readonly slideshowUrl = `${this.apiUrl}/slideshow`;
  private readonly slideshowContextUrl = `${this.apiUrl}/for-slide-show`;

  constructor(private http: HttpClient) {}

  /** Upload slideshow photos (multiple files) */
  uploadSlideshow(formData: FormData): Observable<any> {
    return this.http.post(this.slideshowUrl, formData);
  }

  /** Get slideshow by document number */
  getByDocumentNo(documentNo: string): Observable<any> {
    return this.http.get(`${this.slideshowUrl}/${documentNo}`);
  }

  /** Delete a single photo */
  deletePhoto(slideshowId: number, photoUrl: string): Observable<any> {
    return this.http.request('delete', `${this.slideshowUrl}/photo/${slideshowId}`, {
      body: { photo_url: photoUrl }
    });
  }

  /** Delete entire slideshow */
  deleteSlideshow(slideshowId: number): Observable<any> {
    return this.http.delete(`${this.slideshowUrl}/${slideshowId}`);
  }

  /** Get interment / document info for slideshow page */
  getContext(documentNo: string): Observable<any> {
    return this.http.get(`${this.slideshowContextUrl}/${documentNo}`);
  }
}
