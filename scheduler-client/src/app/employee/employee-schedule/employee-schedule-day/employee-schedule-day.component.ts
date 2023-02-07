import { Component, Input } from '@angular/core';
import { IWorkday, Workday } from 'src/app/models/employees/assignments';
import { Workcode } from 'src/app/models/teams/workcode';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-employee-schedule-day',
  templateUrl: './employee-schedule-day.component.html',
  styleUrls: ['./employee-schedule-day.component.scss']
})
export class EmployeeScheduleDayComponent {
  private _workday: Workday = new Workday();
  @Input() 
  public set workday(wd: Workday) {
    this._workday = wd;
    this.setDateClass();
    this.setWorkdayStyle();
  }
  get workday(): Workday {
    return this._workday;
  }
  dateClass: string = "dayOfMonth";
  workdayStyle: string = "background-color: white;color: black;"

  constructor(
    protected teamService: TeamService,
  ) { }

  setDateClass() {
    const today = new Date();
    if (this.workday.date) {
      if (today.getFullYear() === this.workday.date.getFullYear() 
        && today.getMonth() === this.workday.date.getMonth()
        && today.getDate() === this.workday.date.getDate()) {
        this.dateClass = "dayOfMonth today";
      } else if (this.workday.date.getDay() === 0 
        || this.workday.date.getDay() === 6) {
        this.dateClass = "dayOfMonth weekend";
      } else {
        this.dateClass = "dayOfMonth weekday";
      }
    } else {
      this.dateClass = "dayOfMonth weekday";
    }
  }

  setWorkdayStyle() {
    if (this.workday.code !== "") {
      // find the workcode setting from the team
      const team = this.teamService.getTeam()
      if (team) {
        let found = false;
        for (let i=0; i < team.workcodes.length && !found; i++) {
          let wc: Workcode = team.workcodes[i];
          if (wc.id.toLowerCase() === this.workday.code.toLowerCase()) {
            found = true;
            this.workdayStyle = `background-color:#${wc.backcolor};`
              + `color:#${wc.textcolor};`;
          }
        }
      }
    }
  }
}
