import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { ForecastReport, IForecastReport } from 'src/app/models/sites/forecastreport';
import { ISite, Site } from 'src/app/models/sites/site';
import { SiteResponse } from 'src/app/models/web/siteWeb';
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
      minimum: 1,
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

  getDateString(date: Date): string {
    let answer = `${date.getFullYear()}-`;
    if (date.getMonth() < 9) {
      answer += '0';
    }
    answer += `${date.getMonth() + 1}-`;
    if (date.getDate() < 10) {
      answer += '0';
    }
    answer += `${date.getDate()}`;
    return answer;
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
            this.laborForm.controls['minimum'].setValue(lc.minimumEmployees);
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
      this.laborForm.controls['minimum'].setValue(1);
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

  onAddLaborCode() {
    const chgNo = this.laborForm.value.chargeNumber;
    const ext = this.laborForm.value.extension;
    const startDate = this.laborForm.value.startDate;
    const endDate = this.laborForm.value.endDate;

    this.authService.statusMessage = "Adding new labor code";
    this.dialogService.showSpinner();
    this.siteService.createReportLaborCode(this.teamid, this.site.id, 
      this.report.id, chgNo, ext, this.laborForm.value.clin, 
      this.laborForm.value.slin, this.laborForm.value.wbs, 
      this.laborForm.value.location, this.laborForm.value.minumum,
      this.laborForm.value.hoursPerEmployee, this.laborForm.value.notAssignedName,
      this.laborForm.value.exercise, this.getDateString(startDate), 
      this.getDateString(endDate)).subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: SiteResponse | null = resp.body;
        if (data && data != null && data.site) {
          this.site = new Site(data.site);
          this.siteChanged.emit(new Site(data.site));
          if (this.site.forecasts) {
            this.site.forecasts.forEach(rpt => {
              if (rpt.id === this.report.id) {
                this.report = rpt;
                this.selected = `${chgNo}-${ext}`;
                this.setLaborCode();
              }
            });
          }
          const site = this.siteService.getSite();
          if (site && data.site.id === site.id) {
            this.siteService.setSite(new Site(data.site));
          }
          this.teamService.setSelectedSite(new Site(data.site));
        }
        this.authService.statusMessage = "Retrieval complete"
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.message;
      }
    });
  }

  onClear() {
    this.setLaborCode();
  }

  onUpdateLaborCode(field: string) {
    if (this.selected !== 'new') {
      let value: string = '';
      switch (field.toLowerCase()) {
        case "minimum":
          value = (Math.round(this.laborForm.controls[field].value * 100) 
            / 100).toFixed(0);
          break;
        case "hoursperemployee":
          value = (Math.round(this.laborForm.controls[field].value * 100) 
            / 100).toFixed(1);
          break;
        case "exercise":
          value = (this.laborForm.controls[field].value) ? "true" : "false";
          break;
        case "startdate":
        case "enddate":
          const tdate: Date = this.laborForm.controls[field].value
          value = this.getDateString(tdate);
          break;
        default:
          value = this.laborForm.controls[field].value;
          break;
      }
      const chgNo = this.laborForm.value.chargeNumber;
      const ext = this.laborForm.value.extension;

      console.log(`${chgNo} - ${ext} - ${field} - ${value}`);

      if (value !== '') {
        this.authService.statusMessage = "Adding new labor code";
        this.dialogService.showSpinner();
        this.siteService.updateReportLaborCode(this.teamid, this.site.id, 
          this.report.id, chgNo, ext, field, value).subscribe({
          next: resp => {
            this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: SiteResponse | null = resp.body;
            if (data && data != null && data.site) {
              this.site = new Site(data.site);
              this.siteChanged.emit(new Site(data.site));
              if (this.site.forecasts) {
                this.site.forecasts.forEach(rpt => {
                  if (rpt.id === this.report.id) {
                    this.report = rpt;
                    this.setLaborCode();
                  }
                })
              }
              const site = this.siteService.getSite();
              if (site && data.site.id === site.id) {
                this.siteService.setSite(new Site(data.site));
              }
              this.teamService.setSelectedSite(new Site(data.site));
            }
            this.authService.statusMessage = "Retrieval complete"
          },
          error: err => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = err.message;
          }
        });
      }
    }
  }


}
