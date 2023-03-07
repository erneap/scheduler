import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

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
    private fb: FormBuilder
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
}
