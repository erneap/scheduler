import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IWorkday, Workday } from 'src/app/models/employees/assignments';
import { Workcenter } from 'src/app/models/sites/workcenter';
import { Workcode } from 'src/app/models/teams/workcode';
import { ChangeAssignmentRequest } from 'src/app/models/web/employeeWeb';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-employee-assignment-schedule-day',
  templateUrl: './site-employee-assignment-schedule-day.component.html',
  styleUrls: ['./site-employee-assignment-schedule-day.component.scss']
})
export class SiteEmployeeAssignmentScheduleDayComponent {
  private _workday: Workday = new Workday();
  @Input()
  public set workday(wd: IWorkday) {
    this._workday = new Workday(wd);
    this.setDay();
  }
  get workday(): Workday {
    return this._workday;
  }
  @Output() changed = new EventEmitter<ChangeAssignmentRequest>();
  workCodes: Workcode[] = [];
  workcenters: Workcenter[] = [];
  workHours: string[] = new Array("", "2", "3", "4", "6", "8", "10", "12");
  dayForm: FormGroup;
  dayStyle: string = 'background-color: white; color: black;';
  fontStyle: string = 'background-color: white !important;'
    + 'color: #000000 !important;';

  constructor(
    protected teamService: TeamService,
    protected siteService: SiteService,
    private fb: FormBuilder
  ) {
    this.workCodes = [];
    const team = this.teamService.getTeam();
    if (team) {
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          this.workCodes.push(new Workcode(wc));
        }
      });
    }
    this.workcenters = [];
    const site = this.siteService.getSite();
    if (site && site.workcenters && site.workcenters.length > 0) {
      site.workcenters.forEach(wc => {
        this.workcenters.push(new Workcenter(wc));
      });
    }
    this.dayForm = this.fb.group({
      code: '',
      workcenter: '',
      hours: '',
    });
  }

  setDay() {
    this.dayForm.controls["code"].setValue(this.workday.code);
    this.dayForm.controls["workcenter"].setValue(this.workday.workcenter);
    this.dayForm.controls["hours"].setValue(`${this.workday.hours}`);
    this.dayStyle = 'background-color: white; color: black;';
    this.workCodes.forEach(wc => {
      if (wc.id.toLowerCase() === this.workday.code.toLowerCase()) {
        this.dayStyle = `background-color: #${wc.backcolor};`
          + `color:#${wc.textcolor};`;
      }
    })
  }

  changeField(field: string) {
    let value: string = '';
    switch (field.toLowerCase()) {
      case "code":
        value = this.dayForm.value.code;
        break;
      case "workcenter":
        value = this.dayForm.value.workcenter;
        break;
      case "hours":
        value = this.dayForm.value.hours;
        break;
    }
    const data: ChangeAssignmentRequest = {
      employee: '',
      asgmt: 0,
      schedule: 0,
      workday: this.workday.id,
      field: field,
      value: value,
    }
    this.changed.emit(data);
  }
}
