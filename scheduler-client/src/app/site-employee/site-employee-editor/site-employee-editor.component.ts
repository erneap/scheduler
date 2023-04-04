import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Employee } from 'src/app/models/employees/employee';
import { Site } from 'src/app/models/sites/site';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { UserAccountDialogComponent } from './user-account-dialog/user-account-dialog.component';

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
    protected siteService: SiteService,
    protected dialog: MatDialog
  ) {
  }

  employeeChanged(emp: Employee) {
    this.employee = new Employee(emp);
    if (emp.name.first === '') {
      const site = this.siteService.getSite();
      if (site) {
        this.siteChanged.emit(site);
      }
    }
  }

  siteUpdated(site: Site) {
    this.siteChanged.emit(site);
  }
}
