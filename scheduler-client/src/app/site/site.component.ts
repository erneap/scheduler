import { Component, Input } from '@angular/core';
import { Site } from '../models/sites/site';
import { SiteResponse } from '../models/web/siteWeb';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog-service.service';
import { SiteService } from '../services/site.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss']
})
export class SiteComponent {
  private _siteid: string = '';
  @Input()
  public set siteid(id: string) {
    this._siteid = id;
    this.setSite();
  }
  get siteid(): string {
    return this._siteid;
  }
  site: Site = new Site();

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) { 
    this.setSite();
  }

  setSite() {
    const team = this.teamService.getTeam();
    if (team && this.siteid != '') {
      this.authService.statusMessage = "Retrieving site";
      this.dialogService.showSpinner();
      this.siteService.retrieveSite(team.id, this.siteid, true)
      .subscribe({
        next: resp => {
          this.dialogService.closeSpinner();
          if (resp.headers.get('token') !== null) {
            this.authService.setToken(resp.headers.get('token') as string);
          }
          const data: SiteResponse | null = resp.body;
          if (data && data != null && data.site) {
            this.site = new Site(data.site);
          }
          this.authService.statusMessage = "Retrieval complete"
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.error.exception;
        }
      });
    } else {
      const site = this.siteService.getSite();
      if (site) {
        this.site = new Site(site);
      }
    }
  }
}
