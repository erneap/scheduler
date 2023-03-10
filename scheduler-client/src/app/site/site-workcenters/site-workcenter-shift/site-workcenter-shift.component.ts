import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { ISite, Site } from 'src/app/models/sites/site';
import { IWorkcenter, Shift, Workcenter } from 'src/app/models/sites/workcenter';
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
  }
  get workcenter(): Workcenter {
    return this._workcenter;
  }
  shifts: ListItem[] = [];
  selected: string = '';
  shift: Shift = new Shift();
  shiftForm: FormGroup;

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private fb: FormBuilder) {
    this.shiftForm = this.fb.group({
      
    });
  }

  setShifts() {
    this.shifts = []
    this.shifts.push(new ListItem('new', 'Add New Shift'));
    if (this.workcenter.shifts) {

    }
  }
}
