import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Employee, IEmployee } from '../models/employees/employee';
import { ISite, Site } from '../models/sites/site';
import { IUser } from '../models/users/user';
import { NewSiteRequest, NewSiteWorkcenter, SiteResponse, SiteWorkcenterUpdate,
  NewWorkcenterPosition, WorkcenterPositionUpdate } from '../models/web/siteWeb';
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

  //////////////////////////////////////////////////////////////////////////////
  /// Workcenter CRUD actions
  /// - Retrieve - workcenters are passed as part of the site object and 
  ///   response.
  /// - Add
  /// - Update
  /// - Delete
  //////////////////////////////////////////////////////////////////////////////
  addWorkcenter(teamID: string, siteID: string, wkCtrID: string, name: string):
    Observable<HttpResponse<SiteResponse>> {
    const url = "/scheduler/api/v1/site/workcenter";
    const data: NewSiteWorkcenter = {
      team: teamID,
      siteid: siteID,
      wkctrid: wkCtrID,
      name: name,
    };
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  updateWorkcenter(teamID: string, siteID: string, wkCtrID: string, 
    field: string, value: string): Observable<HttpResponse<SiteResponse>> {
    const url = "/scheduler/api/v1/site/workcenter";
    const data: SiteWorkcenterUpdate = {
      team: teamID,
      siteid: siteID,
      wkctrid: wkCtrID,
      field: field,
      value: value,
    }
    return this.httpClient.put<SiteResponse>(url, data, {observe: 'response'});
  }

  deleteWorkcenter(teamID: string, siteID: string, wkCtrID: string): 
    Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/site/workcenter/${teamID}/${siteID}/${wkCtrID}`;
    return this.httpClient.delete<SiteResponse>(url, {observe: 'response'});
  }

  addWorkcenterShift(teamID: string, siteID: string, wkctrID: string, shiftID: string,
    shiftName: string): Observable<HttpResponse<SiteResponse>> {
    const data: NewWorkcenterPosition = {
      team: teamID,
      siteid: siteID,
      wkctrid: wkctrID,
      positionid: shiftID,
      name: shiftName,
    }
    const url = '/scheduler/api/v1/site/workcenter/shift';
    return this.httpClient.post<SiteResponse>(url, data, {observe: 'response'});
  }

  updateWorkcenterShift(teamID: string, siteID: string, wkctrID: string, 
    shiftID: string, field: string, value: string): 
    Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/site/workcenter/shift';
    const data: WorkcenterPositionUpdate = {
      team: teamID,
      siteid: siteID,
      wkctrid: wkctrID,
      positionid: shiftID,
      field: field,
      value: value,
    }
    return this.httpClient.put<SiteResponse>(url, data, {observe: 'response'});
  }

  deleteWorkcenterShift(teamID: string, siteID: string, wkctrID: string, 
  shiftID: string): Observable<HttpResponse<SiteResponse>> {
    const url = `/scheduler/api/v1/site/workcenter/shift/${teamID}/${siteID}/`
      + `${wkctrID}/${shiftID}`;
    return this.httpClient.delete<SiteResponse>(url, {observe: 'response'});
  }
}
