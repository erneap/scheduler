import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveDay } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-employee-leave',
  templateUrl: './site-employee-leave.component.html',
  styleUrls: ['./site-employee-leave.component.scss']
})
export class SiteEmployeeLeaveComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setLeaves();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  year: number;
  leaveDays: LeaveDay[];
  leaveCodes: Workcode[];
  leaveForm: FormGroup;

  constructor(
    protected teamService: TeamService,
    private fb: FormBuilder
  ) { 
    this.year = (new Date()).getFullYear();
    this.leaveDays = [];
    this.leaveCodes = [];
    const team = this.teamService.getTeam();
    if (team) {
      team.workcodes.forEach(wc => {
        if (wc.isLeave) {
          this.leaveCodes.push(new Workcode(wc));
        }
      });
    }
    this.leaveCodes.sort((a,b) => a.compareTo(b));
    this.leaveForm = this.fb.group({
      date: ['', [Validators.required]],
      code: ['', [Validators.required]],
      hours: [0, [Validators.required]],
      status: ['', [Validators.required]],
    });
  }

  setLeaves() {
    this.leaveDays = [];
    const start = new Date(Date.UTC(this.year, 0, 1));
    const end = new Date(Date.UTC(this.year + 1, 0, 1));
    this.employee.data.leaves.forEach(lv => {
      if (lv.leavedate.getTime() >= start.getTime() 
        && lv.leavedate.getTime() < end.getTime()) {
        this.leaveDays.push(new LeaveDay(lv));
      }
    });
    this.leaveDays.sort((a,b) => b.compareTo(a));
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

  updateYear(direction: string) {
    if (direction.substring(0,1).toLowerCase() === 'u') {
      this.year++;
    } else {
      this.year--;
    }
    this.setLeaves();
  }
}
