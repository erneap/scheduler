import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveRequest } from 'src/app/models/employees/leave';
import { Workcode } from 'src/app/models/teams/workcode';
import { EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';
import { DeleteLeaveRequestDialogComponent } from './delete-leave-request-dialog/delete-leave-request-dialog.component';

@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.scss']
})
export class LeaveRequestComponent {
  private _employee: Employee | undefined;
  @Input()
  public set employee(emp: IEmployee) {
    this._employee = new Employee(emp);
    this.setCurrent();
  }
  get employee(): Employee {
    if (this._employee) {
      return this._employee;
    } else {
      const emp = this.empService.getEmployee();
      if (emp) {
        this._employee = new Employee(emp);
        return this._employee;
      } else {
        return new Employee();
      }
    }
  }
  currentLeaveRequests: LeaveRequest[] = [];
  currentLeaveRequest: LeaveRequest | undefined;
  editorForm: FormGroup;
  leaveList: Workcode[];

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
  }

  setCurrent() {
    const now = new Date();
    this.currentLeaveRequests = [];
    if (this.employee && this.employee.data.requests && this.employee.data.requests.length > 0) {
      this.employee.data.requests.forEach(lr => {
        const lvReq = new LeaveRequest(lr);
        if (lvReq.enddate.getTime() >= now.getTime()) {
          this.currentLeaveRequests.push(lvReq);
        }
      });
    }
    this.currentLeaveRequests.sort((a,b) => b.compareTo(a));
  }

  getDateString(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  getLeaveCodes(): Workcode[] {
    let answer: Workcode[] = [];
    const team = this.teamService.getTeam();
    if (team) {
      team.workcodes.forEach(wc => {
        if (wc.isLeave) {
          answer.push(new Workcode(wc));
        }
      })
    }
    answer.sort((a,b) => a.compareTo(b));
    return answer;
  }

  getCurrentLeaveRequestDate(): string {
    if (this.currentLeaveRequest) {
      return `${this.currentLeaveRequest.requestDate.getMonth() + 1}/`
        + `${this.currentLeaveRequest.requestDate.getDate()}/`
        + `${this.currentLeaveRequest.requestDate.getFullYear()}`;
    }
    return 'NEW';
  }

  getApprovedBy(): string {
    if (this.currentLeaveRequest && this.currentLeaveRequest.approvedby !== '') {
      let answer = '';
      const site = this.siteService.getSite();
      if (site && site.employees && site.employees.length > 0) {
        site.employees.forEach(emp => {
          if (emp.id === this.currentLeaveRequest?.approvedby) {
            answer = emp.name.getFullName();
          }
        });
      }
      return answer;
    }
    return '-';
  }

  getApprovedDate(): string {
    if (this.currentLeaveRequest && this.currentLeaveRequest.approvedby !== '') {
      return `${this.currentLeaveRequest.approvalDate.getMonth() + 1}/`
        + `${this.currentLeaveRequest.approvalDate.getDate()}/`
        + `${this.currentLeaveRequest.approvalDate.getFullYear()}`;
    }
    return '-';
  }

  processNewRequest() {
    if (this.editorForm.valid && this.employee) {
      const start = this.editorForm.value.start;
      const end = this.editorForm.value.end;
      const code = this.editorForm.value.primarycode;
      this.dialogService.showSpinner();
      this.authService.statusMessage = "Processing leave request";
      this.empService.addNewLeaveRequest(this.employee.id, start, end, code)
        .subscribe({
          next: (resp) => {
            this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: EmployeeResponse | null = resp.body;
            if (data && data !== null) {
              if (data.employee) {
                this.employee = data.employee;
              }
              this.setCurrent();
              const emp = this.empService.getEmployee();
              if (data.employee && emp && emp.id === data.employee.id) {
                this.empService.setEmployee(data.employee);
              }
              const site = this.siteService.getSite();
              if (site && site.employees && site.employees.length && data.employee) {
                let found = false;
                for (let i=0; i < site.employees.length && !found; i++) {
                  if (site.employees[i].id === data.employee.id) {
                    site.employees[i] = new Employee(data.employee);
                  }
                }
              }
              if (this.currentLeaveRequests.length > 0) {
                this.currentLeaveRequest = this.currentLeaveRequests[0];
              }
            }
            this.authService.statusMessage = "Leave Request processing complete";
          },
          error: err => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = err.error.exception;
          }
        });
    }
  }

  setDisplayedLeaveRequest(id: string) {
    this.currentLeaveRequests.forEach(lr => {
      if (lr.id === id) {
        this.currentLeaveRequest = new LeaveRequest(lr);
        this.editorForm.controls["start"].setValue(this.currentLeaveRequest.startdate)
        this.editorForm.controls["end"].setValue(this.currentLeaveRequest.enddate);
        this.editorForm.controls["primarycode"].setValue(this.currentLeaveRequest.primarycode);
      }
    });
  }

  processChange(field: string) {
    if (this._employee && this.currentLeaveRequest) {
      switch (field.toLowerCase()) {
        case "start":
        case "end":
          const start = this.editorForm.value.start;
          const end = this.editorForm.value.end;
          let sDate = `${start.getFullYear()}-`
            + `${(start.getMonth() < 9) ? '0' : ''}${start.getMonth() + 1}-`
            + `${(start.getDate() < 10) ? '0' : ''}${start.getDate()}|`
            + `${end.getFullYear()}-`
            + `${(end.getMonth() < 9)? '0' : ''}${end.getMonth() + 1}-`
            + `${(end.getDate() < 10) ? '0' : ''}${end.getDate()}`;
          this.dialogService.showSpinner();
          this.empService.updateLeaveRequest(this.employee.id, 
            this.currentLeaveRequest.id, 'dates', sDate)
            .subscribe({
              next: (resp) => {
                this.authService.statusMessage = "Updating Leave Request "
                  + "Start/End Date changes";
                this.dialogService.closeSpinner();
                if (resp.headers.get('token') !== null) {
                  this.authService.setToken(resp.headers.get('token') as string);
                }
                const data: EmployeeResponse | null = resp.body;
                  if (data && data !== null) {
                  if (data.employee) {
                    this.employee = data.employee;
                    this.employee.data.requests.forEach(req => {
                      if (this.currentLeaveRequest?.id === req.id) {
                        this.currentLeaveRequest = new LeaveRequest(req)
                      }
                    });
                  }
                  this.setCurrent();
                  const emp = this.empService.getEmployee();
                  if (data.employee && emp && emp.id === data.employee.id) {
                    this.empService.setEmployee(data.employee);
                  }
                  const site = this.siteService.getSite();
                  if (site && site.employees && site.employees.length && data.employee) {
                    let found = false;
                    for (let i=0; i < site.employees.length && !found; i++) {
                      if (site.employees[i].id === data.employee.id) {
                        site.employees[i] = new Employee(data.employee);
                      }
                    }
                  }
                }
                this.authService.statusMessage = "Update complete";
              },
              error: err => {
                this.dialogService.closeSpinner();
                this.authService.statusMessage = err.error.exception;
              }
            });
          break;
        case "code":
          this.empService.updateLeaveRequest(this.employee.id, 
            this.currentLeaveRequest.id, 'code', this.editorForm.value.primarycode)
            .subscribe({
              next: (resp) => {
                this.authService.statusMessage = "Updating Leave Request "
                  + "Primary Code change";
                this.dialogService.closeSpinner();
                if (resp.headers.get('token') !== null) {
                  this.authService.setToken(resp.headers.get('token') as string);
                }
                const data: EmployeeResponse | null = resp.body;
                  if (data && data !== null) {
                  if (data.employee) {
                    this.employee = data.employee;
                    this.employee.data.requests.forEach(req => {
                      if (this.currentLeaveRequest?.id === req.id) {
                        this.currentLeaveRequest = new LeaveRequest(req)
                      }
                    });
                  }
                  this.setCurrent();
                  const emp = this.empService.getEmployee();
                  if (data.employee && emp && emp.id === data.employee.id) {
                    this.empService.setEmployee(data.employee);
                  }
                  const site = this.siteService.getSite();
                  if (site && site.employees && site.employees.length && data.employee) {
                    let found = false;
                    for (let i=0; i < site.employees.length && !found; i++) {
                      if (site.employees[i].id === data.employee.id) {
                        site.employees[i] = new Employee(data.employee);
                      }
                    }
                  }
                }
                this.authService.statusMessage = "Update complete";
              },
              error: err => {
                this.dialogService.closeSpinner();
                this.authService.statusMessage = err.error.exception;
              }
            });
          break;
      }
    }
  }

  processDayChange(value: string) {
    if (value !== '' && this.currentLeaveRequest) {
      this.authService.statusMessage = "Updating Leave Request Date change";
      this.empService.updateLeaveRequest(this.employee.id, 
        this.currentLeaveRequest.id, 'day', value)
        .subscribe({
          next: (resp) => {
            this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: EmployeeResponse | null = resp.body;
              if (data && data !== null) {
              if (data.employee) {
                this.employee = data.employee;
                this.employee.data.requests.forEach(req => {
                  if (this.currentLeaveRequest?.id === req.id) {
                    this.currentLeaveRequest = new LeaveRequest(req)
                  }
                });
              }
              this.setCurrent();
              const emp = this.empService.getEmployee();
              if (data.employee && emp && emp.id === data.employee.id) {
                this.empService.setEmployee(data.employee);
              }
              const site = this.siteService.getSite();
              if (site && site.employees && site.employees.length && data.employee) {
                let found = false;
                for (let i=0; i < site.employees.length && !found; i++) {
                  if (site.employees[i].id === data.employee.id) {
                    site.employees[i] = new Employee(data.employee);
                  }
                }
              }
            }
            this.authService.statusMessage = "Update complete";
          },
          error: err => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = err.error.exception;
          }
        });
    }
  }

  deleteRequest() {
    const dialogRef = this.dialog.open(DeleteLeaveRequestDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.dialogService.showSpinner();
        const reqid = this.currentLeaveRequest?.id;
        this.clearRequest();
        if (reqid) {
          this.authService.statusMessage = "Deleting Leave Request";
          this.empService.deleteLeaveRequest(this.employee.id, reqid)
            .subscribe({
              next: (resp) => {
                this.dialogService.closeSpinner();
                if (resp.headers.get('token') !== null) {
                  this.authService.setToken(resp.headers.get('token') as string);
                }
                const data: EmployeeResponse | null = resp.body;
                  if (data && data !== null) {
                  if (data.employee) {
                    this.employee = data.employee;
                    this.employee.data.requests.forEach(req => {
                      if (this.currentLeaveRequest?.id === req.id) {
                        this.currentLeaveRequest = new LeaveRequest(req)
                      }
                    });
                  }
                  this.setCurrent();
                  const emp = this.empService.getEmployee();
                  if (data.employee && emp && emp.id === data.employee.id) {
                    this.empService.setEmployee(data.employee);
                  }
                  const site = this.siteService.getSite();
                  if (site && site.employees && site.employees.length && data.employee) {
                    let found = false;
                    for (let i=0; i < site.employees.length && !found; i++) {
                      if (site.employees[i].id === data.employee.id) {
                        site.employees[i] = new Employee(data.employee);
                      }
                    }
                  }
                }
                this.authService.statusMessage = "Deletion Complete";
              },
              error: err => {
                this.dialogService.closeSpinner();
                this.authService.statusMessage = err.error.exception;
              }
            });
        }
      }
    });
  }

  clearRequest() {
    this.currentLeaveRequest = undefined;
    this.editorForm.controls["start"].setValue(new Date())
    this.editorForm.controls["end"].setValue(new Date());
    this.editorForm.controls["primarycode"].setValue('V');
  }
}
