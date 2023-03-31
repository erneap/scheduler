import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { ForecastReport, IForecastReport } from 'src/app/models/sites/forecastreport';
import { ISite, Site } from 'src/app/models/sites/site';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-forecast-report-labor-codes',
  templateUrl: './site-forecast-report-labor-codes.component.html',
  styleUrls: ['./site-forecast-report-labor-codes.component.scss']
})
export class SiteForecastReportLaborCodesComponent {
  private _report: ForecastReport = new ForecastReport();
  private _site: Site = new Site();
  @Input()
  public set report(rpt: IForecastReport) {
    this._report = new ForecastReport(rpt);
    this.setLaborCodes();
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
  laborcodes: ListItem[] = [];
  selected: string = 'new';
  laborForm: FormGroup;

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
    this.laborForm = this.fb.group({
      chargeNumber: ['', [Validators.required]],
      extension: ['', [Validators.required]],
      clin: '',
      slin: '',
      location: '',
      wbs: '',
      minimums: 1,
      notAssignedName: 'VACANT',
      hoursPerEmployee: 1824,
      exercise: false,
      startDate: [this.report.startDate, [Validators.required]],
      endDate: [this.report.endDate, [Validators.required]],
    })
  }
  
  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  setLaborCodes() {
    this.laborcodes = [];
    this.laborcodes.push(new ListItem('new', 'Add New Labor Code'));
    if (this.report.laborCodes) {
      this.report.laborCodes.sort((a,b) => a.compareTo(b));
      this.report.laborCodes.forEach(lc => {
        const label = `${lc.chargeNumber}-${lc.extension}`;
        this.laborcodes.push(new ListItem(label, label));
      });
    }
  }

  setLaborCode() {
    if (this.selected !== 'new') {
      const parts = this.selected.split("-");
      if (this.report.laborCodes) {
        this.report.laborCodes.forEach(lc => {
          if (lc.chargeNumber === parts[0] && lc.extension === parts[1]) {
            this.laborForm.controls['chargeNumber'].setValue(lc.chargeNumber);
            this.laborForm.controls['extension'].setValue(lc.extension);
            this.laborForm.controls['clin'].setValue(lc.clin);
            this.laborForm.controls['slin'].setValue(lc.slin);
            this.laborForm.controls['wbs'].setValue(lc.wbs);
            this.laborForm.controls['location'].setValue(lc.location);
            this.laborForm.controls['minimums'].setValue(lc.minimumEmployees);
            this.laborForm.controls['notAssignedName'].setValue(
              lc.notAssignedName);
            this.laborForm.controls['hoursPerEmployee'].setValue(
              lc.hoursPerEmployee);
            this.laborForm.controls['exercise'].setValue(lc.exercise);
            this.laborForm.controls['startDate'].setValue(
              new Date(lc.startDate));
            this.laborForm.controls['endDate'].setValue(
              new Date(lc.endDate));
          }
        });
      }
    } else {
      this.laborForm.controls['chargeNumber'].setValue('');
      this.laborForm.controls['extension'].setValue('');
      this.laborForm.controls['clin'].setValue('');
      this.laborForm.controls['slin'].setValue('');
      this.laborForm.controls['wbs'].setValue('');
      this.laborForm.controls['location'].setValue('');
      this.laborForm.controls['minimums'].setValue(1);
      this.laborForm.controls['notAssignedName'].setValue('VACANT');
      this.laborForm.controls['hoursPerEmployee'].setValue(1824);
      this.laborForm.controls['exercise'].setValue(false);
      this.laborForm.controls['startDate'].setValue(
        new Date(this.report.startDate));
      this.laborForm.controls['endDate'].setValue(
        new Date(this.report.endDate));
    }
  }

  onSelect(id: string) {
    this.selected = id;
    this.setLaborCode();
  }
}
