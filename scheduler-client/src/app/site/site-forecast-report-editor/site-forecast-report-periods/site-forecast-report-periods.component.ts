import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { ForecastReport, IForecastReport } from 'src/app/models/sites/forecastreport';
import { ISite, Site } from 'src/app/models/sites/site';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-forecast-report-periods',
  templateUrl: './site-forecast-report-periods.component.html',
  styleUrls: ['./site-forecast-report-periods.component.scss']
})
export class SiteForecastReportPeriodsComponent {
  private _report: ForecastReport = new ForecastReport();
  private _site: Site = new Site();
  @Input()
  public set report(rpt: IForecastReport) {
    this._report = new ForecastReport(rpt);
    this.setPeriods();
  }
  get report(): ForecastReport {
    return this._report;
  }
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
  }
  get site(): Site {
    return this._site;
  }
  @Output() siteChanged = new EventEmitter<Site>();
  teamid: string;
  periods: ListItem[] = [];
  selected: string = 'new';

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    private fb: FormBuilder
  ) {
    const team = this.teamService.getTeam();
    if (team) {
      this.teamid = team.id
    } else {
      this.teamid = '';
    }
  }
  
  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  setPeriods() {
    this.periods = [];
    if (this.report.periods) {
      this.report.periods.sort((a,b) => a.compareTo(b));
      this.report.periods.forEach(prd => {
        const id = `${prd.month.getMonth() + 1}/${prd.month.getFullYear()}`;
        let label = '';
        if (prd.periods) {
          prd.periods.forEach(prds => {
            if (label !== '') {
              label += ",";
            }
            label += `${prds.getMonth() + 1}/${prds.getDate()}`;
          });
        }
        label = `${id} - ${label}`;
        this.periods.push(new ListItem(id, label));
      });
    }
  }
}
