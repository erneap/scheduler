import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ITeam, Team } from '../models/teams/team';
import { ISite, Site } from '../models/sites/site';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { SiteResponse } from '../models/web/siteWeb';
import { CreateTeamCompany, CreateTeamWorkcodeRequest, UpdateTeamRequest } from '../models/web/teamWeb';
import { CreateCompanyHoliday } from '../models/web/teamWeb';

@Injectable({
  providedIn: 'root'
})
export class TeamService extends CacheService {
  constructor(protected httpClient: HttpClient) {
    super();
  }

  getTeam(): Team | undefined{
    const iTeam = this.getItem<ITeam>('current-team');
    if (iTeam) {
      return new Team(iTeam);
    }
    return undefined;
  }

  setTeam(iteam: ITeam) {
    const team = new Team(iteam);
    this.setItem('current-team', team);
  }

  setSelectedSite(isite: ISite) {
    const site = new Site(isite);
    const iSite = this.getItem<ISite>(site.id);
    this.setItem(site.id, site);
  }

  getSelectedSite(siteid: string) : ISite | undefined {
    const iSite = this.getItem<ISite>(siteid);
    if (iSite) {
      return iSite;
    }
    return undefined;
  }

  retrieveSelectedSite(teamid: string, siteid: string): Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/site/${teamid}/${siteid}/true`;
    return this.httpClient.get<SiteResponse>(url, {observe: 'response'});
  }

  addTeamWorkcode(team: string, workcode: string, title: string, start: number,
  isLeave: boolean, premimum: string, text: string, back: string): 
  Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/vi/team/workcode';
    const data: CreateTeamWorkcodeRequest = {
      teamid: team,
      id: workcode,
      title: title,
      start: start,
      shiftCode: premimum,
      isLeave: isLeave,
      textcolor: text,
      backcolor: back,
    }
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  updateTeamWorkcode(team: string, workcode: string, field: string, 
  value: string): Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/vi/team/workcode';
    const data: UpdateTeamRequest = {
      teamid: team,
      additionalid: workcode,
      field: field,
      value: value,
    }
    return this.httpClient.put<SiteResponse>(url, data, {observe: 'response'});
  }
  
  deleteTeamWorkcode(team: string, workcode: string): 
    Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/team/workcode/${team}/${workcode}`;
    return this.httpClient.delete<SiteResponse>(url, { observe: 'response'});
  }

  addTeamCompany(team: string, companyid: string, name: string, ingest: string):
  Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/team/company';
    const data: CreateTeamCompany = {
      teamid: team,
      id: companyid,
      name: name,
      ingest: ingest,
    }
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  updateTeamCompany(team: string, companyid: string, field: string, value: string):
    Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/team/company';
    const data: UpdateTeamRequest = {
      teamid: team,
      additionalid: companyid,
      field: field,
      value: `${value}`,
    }
    return this.httpClient.put<SiteResponse>(url, data, {observe: 'response'});
  }
  
  deleteTeamCompany(team: string, company: string): 
    Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/team/company/${team}/${company}`;
    return this.httpClient.delete<SiteResponse>(url, { observe: 'response'});
  }

  addTeamCompanyHoliday(team: string, company: string, holtype: string, 
    name: string, actual: string): Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/team/company/holiday';
    const data: CreateCompanyHoliday = {
      teamid: team,
      companyid: company,
      holidayid: holtype,
      name: name,
      actual: actual,
    }
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  updateTeamCompanyHoliday(team: string, companyid: string, holiday: string, 
    field: string, value: string): Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/team/company/holiday';
    const data: UpdateTeamRequest = {
      teamid: team,
      additionalid: companyid,
      holiday: holiday,
      field: field,
      value: `${value}`,
    }
    return this.httpClient.put<SiteResponse>(url, data, {observe: 'response'});
  }
}