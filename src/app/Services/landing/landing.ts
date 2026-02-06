// interments-landing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IntermentsLandingService {
  private apiUrl = `${environment.apiUrl}/intermentsReviewLink`; // Laravel API

  constructor(private http: HttpClient) {}

  getInterment(document_no: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${document_no}`);
  }
}
