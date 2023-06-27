import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveRequest } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-leave-request-form',
  templateUrl: './leave-request-form.component.html',
  styleUrls: ['./leave-request-form.component.scss']
})
export class LeaveRequestFormComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(emp: IEmployee) {
    if (emp.id !== this._employee.id) {
      this.currentLeaveRequest = new LeaveRequest();
    }
    this._employee = new Employee(emp);
    this.setCurrent();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  currentLeaveRequests: LeaveRequest[] = [];
  currentLeaveRequest: LeaveRequest = new LeaveRequest();
  editorForm: FormGroup;
  leaveList: Workcode[];
  approver: boolean = false;

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    private fb: FormBuilder,
    protected dialog: MatDialog
  ) { 
    this.editorForm = this.fb.group({
      start: [new Date(), [Validators.required]],
      end: [new Date(), [Validators.required]],
      primarycode: ['V', [Validators.required]],
    });
    this.leaveList = [];
    const team = this.teamService.getTeam();
    if (team) {
      team.workcodes.forEach(wc => {
        if (wc.isLeave) {
          this.leaveList.push(new Workcode(wc));
        }
      });
      this.leaveList.sort((a,b) => a.compareTo(b));
    }
    this.setCurrent();
    const tEmp = this.authService.getUser();
    if (tEmp) {
      if (this.employee.id !== tEmp.id 
        && (this.authService.hasRole('scheduler')
        || this.authService.hasRole('siteleader'))) {
        this.approver = true;
      }
    }
  }

  setCurrent() {
    let now = new Date();
    now = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    this.currentLeaveRequests = [];
    if (this.employee && this.employee.data.requests) {
      this.employee.data.requests.forEach(lr => {
        const lvReq = new LeaveRequest(lr);
        if (lvReq.enddate.getTime() >= now.getTime()) {
          this.currentLeaveRequests.push(lvReq);
        }
      });
    }
    this.currentLeaveRequests = this.currentLeaveRequests.sort((a,b) => b.compareTo(a));
  }

  getDateString(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  getCurrentLeaveRequestDate(): string {
    if (this.currentLeaveRequest) {
      return `${this.currentLeaveRequest.requestDate.getMonth() + 1}/`
        + `${this.currentLeaveRequest.requestDate.getDate()}/`
        + `${this.currentLeaveRequest.requestDate.getFullYear()}`;
    }
    return 'NEW';
  }

  setSelected(id: string) {
    this.currentLeaveRequests.forEach(lr => {
      if (lr.id === id) {
        this.currentLeaveRequest = new LeaveRequest(lr);
      }
    });
  }

  changedEmployee(iEmp: Employee) {
    this.changed.emit(iEmp);
    this.employee = iEmp;
    this.setCurrent();
  }

  getButtonClass(id: string): string {
    let answer = 'employee';
    if (this.currentLeaveRequest.id === id) {
      answer += " active";
    }
    return answer;
  }
}
