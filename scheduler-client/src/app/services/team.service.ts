import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ITeam, Team } from '../models/teams/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService extends CacheService {
  constructor() {
    super();
  }

  getTeam(): Team | undefined{
    return undefined;
  }

  setTeam(team: ITeam) {

  }
}
