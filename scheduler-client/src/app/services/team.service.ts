import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ITeam, Team } from '../models/teams/team';
import { ISite, Site } from '../models/sites/site';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { SiteResponse } from '../models/web/siteWeb';

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
}
