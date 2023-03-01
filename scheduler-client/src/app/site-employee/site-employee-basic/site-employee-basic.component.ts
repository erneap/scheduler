import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-employee-basic',
  templateUrl: './site-employee-basic.component.html',
  styleUrls: ['./site-employee-basic.component.scss']
})
export class SiteEmployeeBasicComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  constructor(
    protected siteService: SiteService,
    protected empService: EmployeeService
  ) {
  }

  employeeChanged(emp: Employee) {
    this.changed.emit(emp);
  }
}
