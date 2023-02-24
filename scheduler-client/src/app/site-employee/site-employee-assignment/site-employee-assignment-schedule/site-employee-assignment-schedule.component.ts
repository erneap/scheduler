import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ISchedule, Schedule } from 'src/app/models/employees/assignments';
import { ChangeAssignmentRequest } from 'src/app/models/web/employeeWeb';
import { WorkWeek } from 'src/app/models/web/internalWeb';

@Component({
  selector: 'app-site-employee-assignment-schedule',
  templateUrl: './site-employee-assignment-schedule.component.html',
  styleUrls: ['./site-employee-assignment-schedule.component.scss']
})
export class SiteEmployeeAssignmentScheduleComponent {
  private _schedule: Schedule = new Schedule();
  @Input()
  public set schedule(sch: ISchedule) {
    this._schedule = new Schedule(sch);
    this.setSchedule();
  }
  get schedule(): Schedule {
    return this._schedule;
  }
  @Output() changeDate = new EventEmitter<ChangeAssignmentRequest>();
  @Output() change = new EventEmitter<ChangeAssignmentRequest>();

  days: string[] = [];
  scheduleForm: FormGroup;
  workweeks: WorkWeek[] = [];
  label: string = 'SCHEDULE 0';
  
  constructor(
    private fb: FormBuilder
  ) {
    this.days = []
    for (let i = 7; i < 30; i += 7) {
      this.days.push(`${i}`);
    }
    this.scheduleForm = this.fb.group({
      days: '7',
    });
  }

  setSchedule() {
    this.label = `SCHEDULE ${this.schedule.id}`;
    this.workweeks = [];
    this.schedule.workdays.sort((a,b) => a.compareTo(b));
    var workweek: WorkWeek | undefined;
    let count = -1;
    for (let i=0; i < this.schedule.workdays.length; i++) {
      if (!workweek || (i % 7) === 0) {
        count++;
        workweek = new WorkWeek(count);
        this.workweeks.push(workweek);
      }
      let date = new Date(2023, 0, i + 1);
      workweek.setWorkday(this.schedule.workdays[i], date);
    }
    this.workweeks.sort((a,b) => a.compareTo(b));
  }

  updateDate(data: ChangeAssignmentRequest) {
    data.schedule = this.schedule.id;
    this.changeDate.emit(data);
  }

  removeSchedule() {
    const data: ChangeAssignmentRequest = {
      employee: '',
      asgmt: 0,
      schedule: this.schedule.id,
      field: 'removeschedule',
      value: '',
    }
    this.change.emit(data);
  }

  changeDays() {
    const data: ChangeAssignmentRequest = {
      employee: '',
      asgmt: 0,
      schedule: this.schedule.id,
      field: 'changeschedule',
      value: this.scheduleForm.value.days,
    }
    this.change.emit(data)
  }
}
