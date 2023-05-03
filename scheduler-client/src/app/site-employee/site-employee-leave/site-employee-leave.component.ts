import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveDay } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';
import { EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
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
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
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

  clearLeaveForm() {
    this.leaveForm.controls['date'].setValue('');
    this.leaveForm.controls['code'].setValue('');
    this.leaveForm.controls['hours'].setValue(0);
    this.leaveForm.controls['status'].setValue('');
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

  updateEmployee(emp: Employee) {
    this.employee = emp;
    this.changed.emit(new Employee(emp));
  }

  addLeave() {
    const reDate = new RegExp('^[0-9]{2}/[0-9]{2}/[0-9]{4}$');
    const reHours = new RegExp('^[0-9]{1,2}\.[0-9]$');
    let error = '';
    const sDate: string = this.leaveForm.value.date;
    let leave: LeaveDay = new LeaveDay();
    leave.id = 0;
    if (reDate.test(sDate)) {
      const parts = sDate.split('/');
      const iYear = Number(parts[2]);
      const iMonth = Number(parts[0]);
      const iDate = Number(parts[1]);
      leave.leavedate = new Date(Date.UTC(iYear, iMonth-1, iDate));
    } else {
      error += 'Leave Date incorrect format (MM/DD/YYYY)';
    }
    leave.code = this.leaveForm.value.code;
    const sHours = this.leaveForm.value.hours;
    if (reHours.test(sHours)) {
      leave.hours = Number(sHours);
    } else {
      if (error !== '') {
        error += ", ";
      }
      error += "Leave Hours is not a number (Decimal hours)"
    }
    leave.status = this.leaveForm.value.status
    if (error !== '') {
      this.authService.statusMessage = 'ERROR: ' + error;
      return;
    }
    this.empService.addLeave(this.employee.id, leave)
      .subscribe({
        next: resp => {
          this.dialogService.closeSpinner();
          if (resp.headers.get('token') !== null) {
            this.authService.setToken(resp.headers.get('token') as string);
          }
          const data: EmployeeResponse | null = resp.body;
          if (data && data !== null) {
            if (data.employee) {
              this.employee = new Employee(data.employee);
              this.employee.data.leaves.sort((a,b) => a.compareTo(b));
              this.setLeaves()
              this.clearLeaveForm();
            }
            const emp = this.empService.getEmployee();
            if (data.employee && emp && emp.id === data.employee.id) {
              this.empService.setEmployee(data.employee);
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.message;
        }
      });
  }
}
