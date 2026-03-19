import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Photolinkupload } from '../../Models/photolinkupload/photolinkupload';

@Injectable({
  providedIn: 'root'
})
export class PhotolinkuploadService {

  private baseUrl = `${environment.apiUrl}/photolinks`; 

  constructor(private http: HttpClient) {}

  // Store links and return the saved link(s)
  storeLinks(documentNo: string, links: string[]): Observable<Photolinkupload[]> {
    return this.http.post<Photolinkupload[]>(`${this.baseUrl}`, {
      document_no: documentNo,
      links: links
    });
  }
}