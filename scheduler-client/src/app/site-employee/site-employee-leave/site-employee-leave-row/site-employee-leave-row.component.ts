import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Employee } from 'src/app/models/employees/employee';
import { ILeaveDay, LeaveDay } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-employee-leave-row',
  templateUrl: './site-employee-leave-row.component.html',
  styleUrls: ['./site-employee-leave-row.component.scss']
})
export class SiteEmployeeLeaveRowComponent {
  private _leave: LeaveDay = new LeaveDay();
  @Input()
  public set leaveday(lv: ILeaveDay) {
    this._leave = new LeaveDay(lv);
    this.setForm();
    this.showInput = (this._leave.status.toLowerCase() !== 'actual');
  }
  get leaveday(): LeaveDay {
    return this._leave;
  }
  @Input() employee: Employee = new Employee();
  @Output() changed = new EventEmitter<string>();
  leaveForm: FormGroup;
  leaveCodes: Workcode[];
  showInput: boolean = true;

  constructor(
    protected empService: EmployeeService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.leaveCodes = [];
    const team = this.teamService.getTeam();
    if (team) {
      team.workcodes.forEach(wc => {
        if (wc.isLeave) {
          this.leaveCodes.push(new Workcode(wc));
        }
      })
    }
    this.leaveForm = this.fb.group({
      date: [this.dateString(new Date()), [Validators.required]],
      code: ['', [Validators.required]],
      hours: ['', [Validators.required]],
      status: ['approved', [Validators.required]],
    })
  }

  setForm() {
    this.leaveForm.controls['date'].setValue(this.dateString(new Date(
      this.leaveday.leavedate)));
    this.leaveForm.controls['code'].setValue(this.leaveday.code);
    this.leaveForm.controls['hours'].setValue(this.leaveday.hours.toFixed(1));
    this.leaveForm.controls['status'].setValue(this.leaveday.status);
  }

  getRowStyle(): string {
    let answer = '';
    if (!this.showInput) {
      this.leaveCodes.forEach(lc => {
        if (this.leaveday.code.toLowerCase() === lc.id.toLowerCase()) {
          answer = `background-color: #FFD9B3;color: #${lc.backcolor}`;
        }
      });
    } else {
      this.leaveCodes.forEach(lc => {
        if (this.leaveday.code.toLowerCase() === lc.id.toLowerCase()) {
          answer = `background-color: #${lc.backcolor};color: #${lc.textcolor}`;
        }
      });
    }
    return answer;
  }

  getInputStyle(): string {
    let answer = 'background-color: transparent;';
    if (!this.showInput) {
      this.leaveCodes.forEach(lc => {
        if (this.leaveday.code.toLowerCase() === lc.id.toLowerCase()) {
          answer += `color: #${lc.backcolor}`;
        }
      });
    } else {
      this.leaveCodes.forEach(lc => {
        if (this.leaveday.code.toLowerCase() === lc.id.toLowerCase()) {
          answer += `color: #${lc.textcolor}`;
        }
      });
    }
    return answer;
  }
  
  dateString(date: Date): string {
    let answer = '';
    if (date.getMonth() < 9) {
      answer += '0';
    }
    answer += `${date.getMonth() + 1}/`;
    if (date.getDate() < 10) {
      answer += '0';
    }
    answer += `${date.getDate()}/${date.getFullYear()}`;
    return answer;
  }

  codeText(): string {
    let answer = '';
    this.leaveCodes.forEach(lc => {
      if (this.leaveday.code.toLowerCase() === lc.id.toLowerCase()) {
        answer = lc.title;
      }
    });
    return answer;
  }
}
