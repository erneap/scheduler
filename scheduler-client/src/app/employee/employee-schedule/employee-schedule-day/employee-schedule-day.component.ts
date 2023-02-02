import { Component, Input } from '@angular/core';
import { IWorkday, Workday } from 'src/app/models/employees/assignments';

@Component({
  selector: 'app-employee-schedule-day',
  templateUrl: './employee-schedule-day.component.html',
  styleUrls: ['./employee-schedule-day.component.scss']
})
export class EmployeeScheduleDayComponent {
  private _celldate: Date = new Date();
  @Input() 
  public set celldate(date: Date) {
    this._celldate = new Date(date);
  }
  get celldate(): Date {
    return this._celldate;
  }
  private _workday: Workday = new Workday();
  @Input() 
  public set workday(wd: IWorkday) {
    this._workday = new Workday(wd);
  }
  get workday(): Workday {
    return this._workday;
  }
  dateClass: string = "dayOfMonth";

  constructor() { }

  setDateClass() {
    const today = new Date();
    if (today.getFullYear() === this.celldate.getFullYear() 
      && today.getMonth() === this.celldate.getMonth()
      && today.getDate() === this.celldate.getDate()) {
      this.dateClass = "dayOfMonth today";
    } else if (this.celldate.getDay() === 0 || this.celldate.getDay() === 6) {
      this.dateClass = "dayOfMonth weekend";
    } else {
      this.dateClass = "dayOfMonth weekday";
    }
  }
}
