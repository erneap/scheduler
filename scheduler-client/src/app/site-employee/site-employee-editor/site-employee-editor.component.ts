import { Component, Input } from '@angular/core';
import { Employee } from 'src/app/models/employees/employee';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-employee-editor',
  templateUrl: './site-employee-editor.component.html',
  styleUrls: ['./site-employee-editor.component.scss']
})
export class SiteEmployeeEditorComponent {
  private _employee: Employee | undefined;
  @Input()
  public set employee(iEmp: Employee) {
    this._employee = new Employee(iEmp);
  }
  get employee(): Employee {
    if (this._employee) {
      return this._employee
    } 
    return new Employee();
  }

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService
  ) {
  }
}
