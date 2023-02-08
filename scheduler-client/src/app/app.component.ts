import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SiteService } from './services/site.service';
import { TeamService } from './services/team.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'client';
  isMobile = false;

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    public authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    private router: Router
  ) {
    iconRegistry.addSvgIcon('calendar',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/images/icons/calendar.svg'));
    this.authService.getUser();
    const site = this.siteService.getSite();
    const team = this.teamService.getTeam();
    let sitename = "";
    let teamname = "";
    if (site) {
      sitename = site.name;
    }
    if (team) {
      teamname = team.name;
    }
    this.authService.setWebLabel(teamname, sitename);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  getHelp() {
    let url = '/scheduler/clientHelp/index.html';
    window.open(url, "help_win");
  }
}