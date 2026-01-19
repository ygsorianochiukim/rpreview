import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewContext } from '../../Models/review/review-context.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewUrl = `${environment.apiUrl}/review`;
  private intermentsUrl = `${environment.apiUrl}/interments`;

  constructor(private http: HttpClient) {}

  getInterments(occupant: string): Observable<ReviewContext[]> {
    return this.http.get<ReviewContext[]>(`${this.intermentsUrl}/${occupant}`);
  }

  submitReview(formData: FormData): Observable<any> {
    return this.http.post(this.reviewUrl, formData);
  }
}

