import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IntermentPhotoService {

  /** Base API URL (must include /api) */
  private readonly apiUrl = environment.apiUrl;

  /** Upload photos endpoint */
  private readonly uploadUrl = `${this.apiUrl}/upload-photos`;

  constructor(private http: HttpClient) {}

  /** Upload new Lapida photo */
  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(`${this.uploadUrl}`, formData);
  }

  /** Update existing Lapida photo */
  updatePhoto(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.uploadUrl}/${id}`, formData);
  }

  /** Get Lapida photo by document number */
  getByDocumentNo(documentNo: string): Observable<any> {
    return this.http.get(`${this.uploadUrl}/by-document/${documentNo}`);
  }

    /** Validate photo before final upload */
  validatePhoto(formData: FormData): Observable<any> {
    // make sure the backend route exists: POST /api/upload-photos/validate-photo
    return this.http.post(`${this.uploadUrl}/validate-photo`, formData);
  }

  /** Store new + update existing Lapida photos in one request */
//storeOrUpdate(formData: FormData): Observable<any> {
  // Make sure this matches your Laravel endpoint
 // return this.http.post(`${this.uploadUrl}/store-or-update`, formData);
//}


}

/** Context model for upload (currently empty, can be extended) */
export class UploadInterredPhotoContext {}
