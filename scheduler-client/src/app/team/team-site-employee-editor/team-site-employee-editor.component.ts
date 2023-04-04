import { Component } from '@angular/core';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { Site } from 'src/app/models/sites/site';
import { Team } from 'src/app/models/teams/team';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-team-site-employee-editor',
  templateUrl: './team-site-employee-editor.component.html',
  styleUrls: ['./team-site-employee-editor.component.scss']
})
export class TeamSiteEmployeeEditorComponent {
  team: Team;
  selected: string = 'new';
  site?: Site;
  sites: ListItem[] = [];

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      this.team = new Team(iTeam);
    } else {
      this.team = new Team();
    }
    this.setSites();
    const iSite = this.siteService.getSite();
    if (iSite) {
      this.site = new Site(iSite);
      this.selected = this.site.id;
    }
  }

  setSites() {
    this.sites = [];
    if (this.team.sites) {
      this.team.sites = this.team.sites.sort((a,b) => a.compareTo(b));
      this.team.sites.forEach(iSite => {
        this.sites.push()
      });
    }
  }
}
