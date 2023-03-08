import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Employee, IEmployee } from '../models/employees/employee';
import { ISite, Site } from '../models/sites/site';
import { IUser } from '../models/users/user';
import { NewSiteRequest, SiteResponse } from '../models/web/siteWeb';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class SiteService extends CacheService {
  constructor(
    protected httpClient: HttpClient
  ) 
  {
    super();
  }

  getSite(): Site | undefined {
    const iSite = this.getItem<ISite>('current-site');
    if (iSite) {
      return new Site(iSite);
    }
    return undefined;
  }

  setSite(isite: ISite): void {
    const site = new Site(isite);
    this.setItem('current-site', site);
  }

  getSelectedEmployee(): Employee | undefined {
    const iEmp = this.getItem<IEmployee>('selected-employee');
    if (iEmp) {
      return new Employee(iEmp);
    }
    return undefined;
  }

  setSelectedEmployee(iEmp: IEmployee): void {
    const emp = new Employee(iEmp);
    this.setItem('selected-employee', emp);
  }

  AddSite(teamID: string, siteID: string, siteName: string, mids: boolean, offset: number,
    sitelead: IUser, scheduler?: IUser): Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/site';
    const data: NewSiteRequest = {
      team: teamID,
      siteid: siteID,
      name: siteName,
      mids: mids,
      offset: offset,
      lead: sitelead,
    }
    if (scheduler) {
      data.scheduler = scheduler;
    }
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  retrieveSite(teamID: string, siteID: string, allemployees: boolean): Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/site/${teamID}/${siteID}/${allemployees}`;
    return this.httpClient.get<SiteResponse>(url, {observe: 'response'});
  }
}
