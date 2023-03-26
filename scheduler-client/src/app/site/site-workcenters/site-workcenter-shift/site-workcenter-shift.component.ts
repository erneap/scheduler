import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { ISite, Site } from 'src/app/models/sites/site';
import { IWorkcenter, Shift, Workcenter } from 'src/app/models/sites/workcenter';
import { Workcode } from 'src/app/models/teams/workcode';
import { SiteResponse } from 'src/app/models/web/siteWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-workcenter-shift',
  templateUrl: './site-workcenter-shift.component.html',
  styleUrls: ['./site-workcenter-shift.component.scss']
})
export class SiteWorkcenterShiftComponent {
  private _site: Site = new Site();
  private _workcenter: Workcenter = new Workcenter();
  @Input()
  public set site(site: ISite) {
    this._site = new Site(site);
  }
  get site(): Site {
    return this._site;
  }
  @Input()
  public set workcenter(wkctr: IWorkcenter) {
    this._workcenter = new Workcenter(wkctr);
    this.setShifts();
  }
  get workcenter(): Workcenter {
    return this._workcenter;
  }
  shifts: ListItem[] = [];
  selected: string = 'new';
  shift: Shift = new Shift();
  shiftForm: FormGroup;
  workcodes: Workcode[] = [];
  showSortUp: boolean = true;
  showSortDown: boolean = true;
  teamid: string = '';

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private fb: FormBuilder) {
    this.shiftForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-z0-9\-]*$')]],
      name: ['', [Validators.required]],
      associated: [[], [Validators.required]],
      paycode: 0,
      minimums: [1, [Validators.required]],
    });
    this.workcodes = [];
    const team = this.teamService.getTeam();
    if (team && team.workcodes) {
      this.teamid = team.id;
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          this.workcodes.push(new Workcode(wc));
        }
      });
      this.workcodes.sort((a,b) => a.compareTo(b));
    }
  }

  setShifts() {
    this.shifts = []
    this.shifts.push(new ListItem('new', 'Add New Shift'));
    if (this.workcenter.shifts) {
      this.workcenter.shifts.forEach(shft => {
        this.shifts.push(new ListItem(shft.id, shft.name));
      });
    }
  }

  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  onSelectShift(id: string) {
    this.selected = id;
    this.setShift();
    this.setShifts();
  }

  setShift() {
    if (this.selected !== 'new') {
      this.workcenter.shifts?.forEach(sh => {
        if (sh.id.toLowerCase() === this.selected.toLowerCase()) {
          this.shiftForm.controls['id'].setValue(sh.id);
          this.shiftForm.controls['name'].setValue(sh.name);
          this.shiftForm.controls['associated'].setValue(sh.associatedCodes);
          this.shiftForm.controls['paycode'].setValue(sh.payCode);
          this.shiftForm.controls['minimums'].setValue(sh.minimums);
        }
      });
    } else {
      this.shiftForm.controls['id'].setValue('');
      this.shiftForm.controls['name'].setValue('');
      this.shiftForm.controls['associated'].setValue([]);
      this.shiftForm.controls['paycode'].setValue(0);
      this.shiftForm.controls['minimums'].setValue(1);
    }
  }

  onChangeSort(direction: string) {
    this.authService.statusMessage = "Changing Sort Position";
    this.dialogService.showSpinner();
    this.siteService.updateWorkcenterShift(this.teamid, this.site.id, 
      this.workcenter.id, this.selected, 'move', direction).subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: SiteResponse | null = resp.body;
        if (data && data != null && data.site) {
          this.site = new Site(data.site);
          const site = this.siteService.getSite();
          if (site && data.site.id === site.id) {
            this.siteService.setSite(new Site(data.site));
            if (site.workcenters) {
              site.workcenters.forEach(wc => {
                if (wc.id === this.workcenter.id) {
                  this.workcenter = new Workcenter(wc);
                  this.setShifts();
                }
              });
            }
          }
          this.teamService.setSelectedSite(new Site(data.site));
        }
        this.authService.statusMessage = "Retrieval complete"
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.error.exception;
      }
    });
  }

  onChangeField(field: string) {

  }

  onClearClick() {

  }

  onAddShift() {

  }

  onDeleteShift() {

  }
}
