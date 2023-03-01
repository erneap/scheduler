import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';

@Component({
  selector: 'app-site-employee-variation',
  templateUrl: './site-employee-variation.component.html',
  styleUrls: ['./site-employee-variation.component.scss']
})
export class SiteEmployeeVariationComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();
}
