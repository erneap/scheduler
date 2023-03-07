import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee } from 'src/app/models/employees/employee';
import { Site } from 'src/app/models/sites/site';
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
  @Output() siteChanged = new EventEmitter<Site>()

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService
  ) {
  }

  employeeChanged(emp: Employee) {
    this.employee = new Employee(emp);
  }

  siteUpdated(site: Site) {
    this.siteChanged.emit(site);
  }
}
