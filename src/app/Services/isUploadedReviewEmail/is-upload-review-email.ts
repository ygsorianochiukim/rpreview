import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IsUploadReviewEmailService {

  private readonly apiUrl = environment.apiUrl;
  private readonly reviewEmailUrl = `${this.apiUrl}/isReviewedEmail`;

  constructor(private http: HttpClient) {}

  /** Extract reviewed email records */
  extractReviews(): Observable<any> {
    return this.http.get(this.reviewEmailUrl);
  }

}