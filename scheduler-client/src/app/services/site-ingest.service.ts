import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../models/web/employeeWeb';

@Injectable({
  providedIn: 'root'
})
export class SiteIngestService {
  constructor(
    protected httpClient: HttpClient
  ) 
  {}

  fileIngest(formdata: FormData): Observable<HttpResponse<Message>> {
    const url = '/scheduler/api/v1/ingest/';
    return this.httpClient.post<Message>(url, formdata, {observe: 'response'});
  }
}
