import { Component } from '@angular/core';
import { Employee } from 'src/app/models/employees/employee';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-employee-basic',
  templateUrl: './site-employee-basic.component.html',
  styleUrls: ['./site-employee-basic.component.scss']
})
export class SiteEmployeeBasicComponent {
  employee: Employee;

  constructor(
    protected siteService: SiteService,
    protected empService: EmployeeService
  ) {
    let iEmp = this.siteService.getSelectedEmployee();
    if (iEmp) {
      this.employee = new Employee(iEmp);
    } else {
      iEmp = this.empService.getEmployee();
      if (iEmp) {
        this.employee = new Employee(iEmp);
      } else {
        this.employee = new Employee();
      }
    }
  }
}
