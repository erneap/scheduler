import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { CofSReport } from 'src/app/models/sites/cofsreport';
import { ISite, Site } from 'src/app/models/sites/site';
import { Team } from 'src/app/models/teams/team';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-cofs-report-editor',
  templateUrl: './site-cofs-report-editor.component.html',
  styleUrls: ['./site-cofs-report-editor.component.scss']
})
export class SiteCofsReportEditorComponent {
  private _site: Site = new Site();
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
    this.setReports();
  }
  get site(): Site {
    return this._site;
  }
  @Output() siteChanged = new EventEmitter<Site>();
  team: Team;
  selected: string = 'new';
  assignedCompany: string = '';
  unassignedCompany: string = '';
  reports: ListItem[] = [];
  report: CofSReport = new CofSReport();
  reportForm: FormGroup;
  compUnassigned: ListItem[] = [];
  compAssigned: ListItem[] = [];
  companyForm: FormGroup;
  showSortUp: boolean = true;
  showSortDown: boolean = true;


  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    private fb: FormBuilder
  ) {
    const iTeam = this.teamService.getTeam();
    this.team = new Team(iTeam);
    this.reportForm = this.fb.group({
      name: ['', [Validators.required]],
      short: ['', [Validators.required]],
      start: [new Date(), [Validators.required]],
      end: [new Date(), [Validators.required]],
    });
    this.companyForm = this.fb.group({
      signature: ['', [Validators.required]],
      exercise: false,
    });
  }

  setReports() {
    this.reports = [];
    this.reports.push(new ListItem('new', 'Add New CofS Report'));
    this.site.cofs.forEach(rpt => {
      const lbl = `${rpt.name} - (${rpt.reportPeriod()})`;
      this.reports.push(new ListItem(`${rpt.id}`, lbl))
    });
  }
  
  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  getAssignedCompanyStyle(id: string): string {
    if (id.toLowerCase() === this.assignedCompany.toLowerCase()) {
      return "company active";
    }
    return "company";
  }

  getUnassignedCompanyStyle(id: string): string {
    if (id.toLowerCase() === this.unassignedCompany.toLowerCase()) {
      return "company active";
    }
    return "company";
  }

  onChange(field: string) {

  }

  onAddReport() {

  }

  setReport() {
    if (this.selected !== 'new') {
      if (this.site.cofs) {
        this.site.cofs.forEach(rpt => {
          if (this.selected === `${rpt.id}`) {
            this.report = new CofSReport(rpt);
            this.reportForm.controls['name'].setValue(rpt.name);
            this.reportForm.controls['short'].setValue(rpt.shortname);
            this.reportForm.controls['start'].setValue(rpt.startdate);
            this.reportForm.controls['end'].setValue(rpt.enddate);
          }
        });
      }
    } else {
      this.report = new CofSReport();
      this.reportForm.controls['name'].setValue('');
      this.reportForm.controls['short'].setValue('');
      this.reportForm.controls['start'].setValue(new Date());
      this.reportForm.controls['end'].setValue(new Date());
    }
    this.compAssigned = [];
    this.compUnassigned = [];
    this.team.companies.sort((a,b) => a.compareTo(b));
    this.team.companies.forEach(co => {
      let found = false;
      this.report.companies.forEach(c => {
        if (c.id === co.id) {
          found = true;
          const li = new ListItem(co.id, co.name);
          li.sortid = c.sortid;
          this.compAssigned.push(li);
        }
      });
      if (!found) {
        this.compUnassigned.push(new ListItem(co.id, co.name));
      }
    });
    this.compAssigned.sort((a,b) => a.compareTo(b));
    if (this.unassignedCompany !== '') {
      this.onSelectUnassignedCompany(this.unassignedCompany);
    }
    if (this.assignedCompany !== '') {
      this.onSelectAssignedCompany(this.assignedCompany);
    }
  }

  onSelectReport(id: string) {
    this.selected = id;
    this.setReport();
  }

  onSelectUnassignedCompany(id: string) {
    if (this.unassignedCompany === id) {
      this.unassignedCompany = '';
    } else {
      this.unassignedCompany = id;
    }
  }

  onSelectAssignedCompany(id: string) {
    if (this.assignedCompany === id) {
      this.assignedCompany = '';
    } else {
      this.assignedCompany = id;
    }
    if (this.assignedCompany === '') {
      this.companyForm.controls['signature'].setValue('');
      this.companyForm.controls['exercise'].setValue(false);
    } else {
      this.report.companies.forEach(co => {
        if (co.id === this.assignedCompany) {
          this.companyForm.controls['signature']
            .setValue(co.signature);
          this.companyForm.controls['exercise']
            .setValue(co.exercises);
        }
      });
    }
  }

  onChangeSort(direction: string) {
  }
}
