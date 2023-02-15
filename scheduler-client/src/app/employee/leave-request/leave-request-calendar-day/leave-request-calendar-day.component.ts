import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ILeaveDay, LeaveDay } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';

@Component({
  selector: 'app-leave-request-calendar-day',
  templateUrl: './leave-request-calendar-day.component.html',
  styleUrls: ['./leave-request-calendar-day.component.scss']
})
export class LeaveRequestCalendarDayComponent {
  private _leave: LeaveDay = new LeaveDay();
  @Input()
  public set leave(lv: ILeaveDay) {
    this._leave = new LeaveDay(lv);
    this.setLeave()
  }
  get leave(): LeaveDay {
    return this._leave;
  }
  @Input() leaveCodes: Workcode[] = [];
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
  dayForm: FormGroup;
  dayStyle: string = 'background-color: white; color: black;';

  constructor(
    private fb: FormBuilder,
  ) {
    this.dayForm = this.fb.group({
      code: '',
      hours: 0,
    });
  }

  setLeave() {
    this.dayForm.controls["code"].setValue(this.leave.code);
    this.dayForm.controls["hours"].setValue(this.leave.hours);
    if (this.leave.leavedate.getTime() >= this.startDate.getTime()
      && this.leave.leavedate.getTime() <= this.endDate.getTime()) {
      this.leaveCodes.forEach(wc => {
        if (wc.id.toLowerCase() == this.leave.code.toLowerCase()) {
          this.dayStyle = `background-color: #${wc.backcolor};color: #${wc.textcolor};`;
        }
      });
    } else {
      this.dayStyle = `background-color: darkgray;color: black;`;
    }
  }
}
