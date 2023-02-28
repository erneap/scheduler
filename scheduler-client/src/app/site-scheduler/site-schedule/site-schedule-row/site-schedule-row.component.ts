import { Component, Input } from '@angular/core';
import { Workday } from 'src/app/models/employees/assignments';
import { Employee, IEmployee } from 'src/app/models/employees/employee';

@Component({
  selector: 'app-site-schedule-row',
  templateUrl: './site-schedule-row.component.html',
  styleUrls: ['./site-schedule-row.component.scss']
})
export class SiteScheduleRowComponent {
  private _employee: Employee = new Employee();
  private _month: Date = new Date();
  @Input()
  public set employee(emp: IEmployee) {
    this._employee = new Employee(emp);
    this.setMonth()
  }
  get employee(): Employee {
    return this._employee;
  }
  @Input()
  public set index(ind: number) {
    if ((ind % 2) === 0) {
      this.baseClass = 'background-color: white; color: black;';
    } else {
      this.baseClass = 'background-color: lightgray;color: black;';
    }
  }
  @Input()
  public set month(dt: Date) {
    this._month = new Date(dt);
    this.setMonth();
  }
  get month(): Date {
    return this._month;
  }
  baseClass: string = 'background-color: white; color: black;';
  workdays: Workday[] = [];
  dates: Date[] = [];

  constructor() {}

  setMonth() {
    this.workdays = [];
    this.dates = [];
    let start = new Date(Date.UTC(this.month.getFullYear(), this.month.getMonth(), 1));
    while (start.getMonth() === this.month.getMonth()) {
      this.dates.push(new Date(start));
      this.workdays.push(this.employee.data.getWorkday(this.employee.site, start));
      start = new Date(start.getTime() + (24 * 3600000));
    }
  }
}
