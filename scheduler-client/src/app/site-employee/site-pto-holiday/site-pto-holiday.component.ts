import { Component } from '@angular/core';
import { Employee } from 'src/app/models/employees/employee';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-pto-holiday',
  templateUrl: './site-pto-holiday.component.html',
  styleUrls: ['./site-pto-holiday.component.scss']
})
export class SitePtoHolidayComponent {
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
