import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ILeaveDay, LeaveDay } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';

@Component({
  selector: 'app-leave-request-calendar-day',
  templateUrl: './leave-request-calendar-day.component.html',
  styleUrls: ['./leave-request-calendar-day.component.scss']
})
export class LeaveRequestCalendarDayComponent {
  private _leave: LeaveDay | undefined;
  private _start: Date | undefined;
  private _end: Date | undefined;
  private _codes: Workcode[] = [];
  @Input()
  public set leave(lv: ILeaveDay) {
    this._leave = new LeaveDay(lv);
    this.setLeave()
  }
  get leave(): LeaveDay {
    if (this._leave) {
      return this._leave;
    }
    return new LeaveDay();
  }
  @Input()
  public set leaveCodes(cds: Workcode[]) {
    this._codes = cds;
    this.setLeave();
  }
  get leaveCodes(): Workcode[] {
    return this._codes;
  }
  @Input() 
  public set startDate(start: Date){
    this._start = new Date(start);
    this.setLeave()
  }
  get startDate(): Date {
    if (this._start) {
      return this._start;
    }
    return new Date();
  }
  @Input()
  public set endDate(end: Date) {
    this._end = new Date(end);
    this.setLeave();
  }
  get endDate(): Date {
    if (this._end) {
      return this._end;
    }
    return new Date();
  }
  @Output() changed = new EventEmitter<string>();

  dayForm: FormGroup;
  dayStyle: string = 'background-color: black; color: black;';
  fontStyle: string = 'color: #000000 !important;';

  constructor(
    private fb: FormBuilder,
  ) {
    this.dayForm = this.fb.group({
      code: '',
      hours: 0,
    });
  }

  setLeave() {
    if (this._leave && this._start && this._end && this._codes.length > 0) {
      const end = new Date(this.endDate.getTime() + (24 * 3600000));
      this.dayForm.controls["code"].setValue(this.leave.code);
      if (this.leave.code !== '') {
        this.dayForm.controls["hours"].setValue(this.leave.hours);
      } else {
        this.dayForm.controls["hours"].setValue('');
      }
      if (this.leave.leavedate.getTime() >= this.startDate.getTime()
        && this.leave.leavedate.getTime() <= end.getTime()) {
        if (this.leave.code !== '') {
          this.leaveCodes.forEach(wc => {
            if (wc.id.toLowerCase() == this.leave.code.toLowerCase()) {
              this.dayStyle = `background-color: #${wc.backcolor};color: #${wc.textcolor};`;
              this.fontStyle = `color: #${wc.textcolor} !important;`;
            }
          });
        } else {
          this.dayStyle = 'background-color: white;color: black;';
          this.fontStyle = `color: #FFFFFF !important;`;
        }
      } else {
        this.dayStyle = `background-color: black;color: black;`;
        this.fontStyle = `color: #000000 !important;`;
      }
    }
  }

  changeCode() {
    this.leave.code = this.dayForm.value.code;
    this.leave.hours = Number(this.dayForm.value.hours);
    let data: string = `${this.leave.leavedate.getFullYear()}-`
      + ((this.leave.leavedate.getMonth() < 9) ? '0' : '') 
      + `${this.leave.leavedate.getMonth() + 1}-`
      + ((this.leave.leavedate.getDate() < 10) ? '0' : '') 
      + `${this.leave.leavedate.getDate()}`
      + `|${this.leave.code}|${this.leave.hours}`;
    this.changed.emit(data);
    this.setLeave();
  }
}
