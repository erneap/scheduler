import { Injectable } from '@angular/core';
import { ISite, Site } from '../models/sites/site';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class SiteService extends CacheService {

  constructor() 
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
}
