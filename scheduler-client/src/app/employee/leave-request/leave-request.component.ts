import { Component, Input } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { EmployeeService } from 'src/app/services/employee.service';

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

  constructor(
    protected empService: EmployeeService
  ) { 
  }

  changedEmployee(iEmp: Employee) {
    this.employee = iEmp;
  }
}
