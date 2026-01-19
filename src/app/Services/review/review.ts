import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewContext } from '../../Models/review/review-context.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private intermentsUrl = 'http://127.0.0.1:8000/api/interments';
  private reviewUrl = 'http://127.0.0.1:8000/api/review';

  constructor(private http: HttpClient) {}

  getInterments(occupant: string): Observable<ReviewContext[]> {
    return this.http.get<ReviewContext[]>(`${this.intermentsUrl}/${occupant}`);
  }

  submitReview(formData: FormData): Observable<any> {
    return this.http.post(this.reviewUrl, formData);
  }
}

