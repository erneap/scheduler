import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DeletionConfirmationComponent } from 'src/app/generic/deletion-confirmation/deletion-confirmation.component';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { Site } from 'src/app/models/sites/site';
import { EmployeeResponse, Message } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { UserAccountDialogComponent } from '../site-employee-editor/user-account-dialog/user-account-dialog.component';

@Component({
  selector: 'app-site-employee-profile',
  templateUrl: './site-employee-profile.component.html',
  styleUrls: ['./site-employee-profile.component.scss']
})
export class SiteEmployeeProfileComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setEmployeePerms();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();
  permForm: FormGroup;

  constructor(
    protected siteService: SiteService,
    protected empService: EmployeeService,
    protected authService: AuthService,
    protected dialogService: DialogService,
    private fb: FormBuilder,
    protected dialog: MatDialog
  ) {
    this.permForm = this.fb.group({
      employee: false,
      scheduler: false,
      company: false,
      siteleader: false,
      teamleader: false,
      admin: false,
    })

  }

  setEmployeePerms() {
    if (this.employee.user) {
      this.permForm.controls['employee'].setValue(this.employee.user
        .isInGroup('scheduler', 'employee'));
      this.permForm.controls['scheduler'].setValue(this.employee.user
        .isInGroup('scheduler', 'scheduler'));
      this.permForm.controls['company'].setValue(this.employee.user
        .isInGroup('scheduler', 'company'));
      this.permForm.controls['siteleader'].setValue(this.employee.user
        .isInGroup('scheduler', 'siteleader'));
      this.permForm.controls['teamleader'].setValue(this.employee.user
        .isInGroup('scheduler', 'teamleader'));
      this.permForm.controls['admin'].setValue(this.employee.user
        .isInGroup('scheduler', 'admin'));
    } else {
      this.permForm.controls['employee'].setValue(false);
      this.permForm.controls['scheduler'].setValue(false);
      this.permForm.controls['company'].setValue(false);
      this.permForm.controls['siteleader'].setValue(false);
      this.permForm.controls['teamleader'].setValue(false);
      this.permForm.controls['admin'].setValue(false);
    }
  }

  employeeChanged(emp: Employee) {
    this.changed.emit(emp);
  }

  addUserAccount(): void {
    const dialogRef = this.dialog.open(UserAccountDialogComponent, {
      data: {emailAddress: '', password: ''},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      if (result.data) {
        if (result.data.emailAddress !== '') {
          this.dialogService.showSpinner();
          this.authService.statusMessage = "Adding User Account"
          this.empService.addUserAccount(this.employee.id, 
          result.data.emailAddress, result.data.password).subscribe({
            next: resp => {
              this.dialogService.closeSpinner();
              if (resp.headers.get('token') !== null) {
                this.authService.setToken(resp.headers.get('token') as string);
              }
              const data: EmployeeResponse | null = resp.body;
              if (data && data !== null) {
                if (data.employee) {
                  this.employee = new Employee(data.employee);
                }
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
                      found = true;
                    }
                  }
                  if (!found) {
                    site.employees.push(new Employee(data.employee));
                  }
                  site.employees.sort((a,b) => a.compareTo(b));
                  this.siteService.setSite(site);
                  this.siteService.setSelectedEmployee(data.employee);
                }
              }
              this.changed.emit(new Employee(this.employee));
              this.authService.statusMessage = "Update complete";
            },
            error: err => {
              this.dialogService.closeSpinner();
              this.authService.statusMessage = err.error.exception;
            }
          });
        }
      }
    })
  }

  updatePermission(element: string) {
    let field = '';
    if (this.permForm.controls[element].value) {
      field = 'addperm';
    } else {
      field = 'removeperm';
    }
    this.dialogService.showSpinner();
    this.authService.statusMessage = "Adjusting Permissions";
    this.empService.updateEmployee(this.employee.id, field, element)
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
            }
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
                  found = true;
                }
              }
              if (!found) {
                site.employees.push(new Employee(data.employee));
              }
              site.employees.sort((a,b) => a.compareTo(b));
              this.siteService.setSite(site);
              this.siteService.setSelectedEmployee(data.employee);
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.error.exception;
        }
      });
  }

  unlockUser() {
    this.dialogService.showSpinner();
    this.authService.statusMessage = "Unlocking Account";
    this.empService.updateEmployee(this.employee.id, 'unlock', '0')
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
            }
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
                  found = true;
                }
              }
              if (!found) {
                site.employees.push(new Employee(data.employee));
              }
              site.employees.sort((a,b) => a.compareTo(b));
              this.siteService.setSite(site);
              this.siteService.setSelectedEmployee(data.employee);
            }
          }
          this.changed.emit(new Employee(this.employee));
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.error.exception;
        }
      });
  }

  deleteEmployee() {
    const dialogRef = this.dialog.open(DeletionConfirmationComponent, {
      width: '350px',
      data: {title: 'Confirm Employee Deletion', 
      message: 'Are you sure you want to delete this employee?'},
    });

    dialogRef.afterClosed().subscribe(result => { 
      if (result === 'yes') {
        this.empService.deleteEmployee(this.employee.id)
          .subscribe({
            next: resp => {
              this.dialogService.closeSpinner();
              if (resp.headers.get('token') !== null) {
                this.authService.setToken(resp.headers.get('token') as string);
              }
              const data: Message | null = resp.body;
              if (data?.message === 'employee deleted') {
                this.siteService.setSelectedEmployee(new Employee());
                const site = this.siteService.getSite();
                if (site && site.employees) {
                  let found = false;
                  for (let i=0; i < site.employees.length && !found; i++) {
                    if (site.employees[i].id === this.employee.id) {
                      found = true;
                      site.employees.splice(i, 1);
                    }
                  }
                  this.siteService.setSite(new Site(site));
                }
              }
              this.changed.emit(new Employee());
            },
            error: err => {
              this.dialogService.closeSpinner();
              this.authService.statusMessage = err.error.exception;
            }
          });
      }
    });
  }
}
