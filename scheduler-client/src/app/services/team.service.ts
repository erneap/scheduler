import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ITeam, Team } from '../models/teams/team';
import { ISite, Site } from '../models/sites/site';

@Injectable({
  providedIn: 'root'
})
export class TeamService extends CacheService {
  constructor() {
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
    this.setItem('current-site', site);
  }

  getSelectedSite() : Site | undefined {
    const iSite = this.getItem<ISite>('current-site');
    if (iSite) {
      return new Site(iSite);
    }
    return undefined;
  }
}
