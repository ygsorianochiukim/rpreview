import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Photolinkupload } from '../../Models/photolinkupload/photolinkupload';

@Injectable({
  providedIn: 'root'
})
export class PhotolinkuploadService {

  private baseUrl = `${environment.apiUrl}/storage`;

  constructor(private http: HttpClient) {}

  /**
   * Store multiple links with photographer name
   */
  storeLinks(
    documentNo: string,
    links: { link: string; photographer_name: string }[]
  ): Observable<Photolinkupload[]> {
    return this.http.post<Photolinkupload[]>(`${this.baseUrl}`, {
      document_no: documentNo,
      links: links
    });
  }

  /**
   * Get saved photo links by document_no
   */
  getLinks(documentNo: string): Observable<Photolinkupload[]> {
    return this.http.get<Photolinkupload[]>(
      `${this.baseUrl}/view-links/${documentNo}`
    );
  }

  /**
   * Update existing link (edit functionality)
   */
  updateLink(
    id: number,
    payload: { link: string; photographer_name: string }
  ): Observable<Photolinkupload> {
    return this.http.put<Photolinkupload>(
      `${this.baseUrl}/${id}`,
      payload
    );
  }

  /**
   * (Optional) Get all links
   */
  getAll(): Observable<Photolinkupload[]> {
    return this.http.get<Photolinkupload[]>(
      `${this.baseUrl}/view-links`
    );
  }

  validateDocument(documentNo: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/savelink/${documentNo}`);
}

}