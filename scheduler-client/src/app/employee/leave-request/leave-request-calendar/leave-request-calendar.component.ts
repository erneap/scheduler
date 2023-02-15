import { Component, Input } from '@angular/core';
import { ILeaveDay, LeaveDay, LeaveGroup, LeaveMonth } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';

@Component({
  selector: 'app-leave-request-calendar',
  templateUrl: './leave-request-calendar.component.html',
  styleUrls: ['./leave-request-calendar.component.scss']
})
export class LeaveRequestCalendarComponent {
  private _startDate: Date = new Date();
  private _endDate: Date = new Date();
  private _leaveDays: LeaveDay[] = [];
  @Input() leaveCodes: Workcode[] = [];
  @Input()
  public set startdate(date: Date) {
    this._startDate = new Date(date);
    this.setMonth();
  }
  get startdate(): Date {
    return this._startDate;
  }
  @Input()
  public set enddate(date: Date) {
    this._endDate = new Date(date);
    this.setMonth();
  }
  get enddate(): Date {
    return this._endDate;
  }
  @Input()
  public set leavedays(days: ILeaveDay[]) {
    this._leaveDays = [];
    days.forEach(day => {
      this._leaveDays.push(new LeaveDay(day));
    });
    this._leaveDays.sort((a,b) => a.compareTo(b));
    this.setMonth();
  }
  get leavedays(): LeaveDay[] {
    return this._leaveDays;
  }
  calendar: LeaveMonth = new LeaveMonth();

  setMonth() {
    this.calendar = new LeaveMonth();
    let start = new Date(this.startdate);
    while (start.getDay() !== 0) {
      start = new Date(start.getTime() - (24 * 3600000));
    }
    let end = new Date(this.enddate);
    while (end.getDate() !== 6) {
      end = new Date(end.getTime() + (24 * 3600000));
    }
    let week: LeaveGroup = new LeaveGroup();
    while (start.getTime() <= end.getTime()) {
      if (start.getDay() == 0) {
        week = new LeaveGroup()
        this.calendar.leaveGroups.push(week);
      }
      const day = new LeaveDay();
      day.leavedate = start;
      this._leaveDays.forEach(lv => {
        if (day.leavedate.getFullYear() === lv.leavedate.getFullYear()
          && day.leavedate.getMonth() === lv.leavedate.getMonth()
          && day.leavedate.getDate() === lv.leavedate.getDate()) {
          day.code = lv.code;
          day.hours = lv.hours;
        }
      });
      week.addLeave(day);
    }
  }
}
