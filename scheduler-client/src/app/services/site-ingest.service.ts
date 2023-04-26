import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../models/web/employeeWeb';
import { IngestChange, IngestResponse, ManualIngestChanges } from '../models/web/siteWeb';

@Injectable({
  providedIn: 'root'
})
export class SiteIngestService {
  constructor(
    protected httpClient: HttpClient
  ) 
  {}

  getIngestEmployees(team: string, site: string, company: string): 
    Observable<HttpResponse<IngestResponse>> {
    const url = `/scheduler/api/v1/ingest/${team}/${site}/${company}`;
    return this.httpClient.get<IngestResponse>(url, { observe: 'response'});
  }

  fileIngest(formdata: FormData): Observable<HttpResponse<IngestResponse>> {
    const url = '/scheduler/api/v1/ingest/';
    return this.httpClient.post<IngestResponse>(url, formdata, {observe: 'response'});
  }

  manualIngest(team: string, site: string, company: string, changes: IngestChange[]): 
    Observable<HttpResponse<IngestResponse>> {
    const url = '/scheduler/api/v1/ingest/';
    const data: ManualIngestChanges = {
      teamid: team,
      siteid: site,
      companyid: company,
      changes: changes,
    }
    return this.httpClient.put<IngestResponse>(url, data, {observe: 'response'});
  }
}
