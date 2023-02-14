import { Component, Input } from '@angular/core';
import { LeaveMonth } from 'src/app/models/employees/leave';

@Component({
  selector: 'app-pto-month',
  templateUrl: './pto-month.component.html',
  styleUrls: ['./pto-month.component.scss']
})
export class PtoMonthComponent {
  private _month: LeaveMonth = new LeaveMonth();
  @Input()
  public set leaveMonth(month: LeaveMonth) {
    this._month = new LeaveMonth(month);
  }
  get leaveMonth(): LeaveMonth {
    return this._month;
  }
  months: string[] = new Array("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL",
    "AUG", "SEP", "OCT", "NOV", "DEC");

  constructor() {}

  getActualHours(): string {
    let total = 0.0;
    this._month.leaveGroups.forEach(lg => {
      lg.leaves.forEach(lv => {
        if (lv.status.toLowerCase() === 'actual' && lv.code.toLowerCase() === 'v') {
          total += lv.hours
        }
      });
    })
    return total.toFixed(1);
  }

  getProjectedHours(): string {
    let total = 0.0;
    this._month.leaveGroups.forEach(lg => {
      lg.leaves.forEach(lv => {
        if (lv.status.toLowerCase() !== 'actual' && lv.code.toLowerCase() === 'v') {
          total += lv.hours
        }
      });
    })
    return total.toFixed(1);
  }
}
