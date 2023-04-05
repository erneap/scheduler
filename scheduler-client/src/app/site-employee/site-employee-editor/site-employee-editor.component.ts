import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Employee } from 'src/app/models/employees/employee';
import { ISite, Site } from 'src/app/models/sites/site';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

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
  private _site: Site = new Site();
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
  }
  get site(): Site {
    return this._site;
  }
  @Output() siteChanged = new EventEmitter<Site>()

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialog: MatDialog
  ) {
    const iSite = this.siteService.getSite();
    if (iSite) {
      this.site = iSite;
    }
  }

  employeeChanged(emp: Employee) {
    this.employee = new Employee(emp);
    if (emp.name.first === '') {
      let found = false;
      const iEmp = this.empService.getEmployee();
      if ( iEmp && iEmp.id === this.employee.id) {
        this.empService.setEmployee(this.employee);
      }
      if (this.site.employees) {
        for (let i=0; i < this.site.employees.length && !found; i++) {
          if (this.site.employees[i].id === emp.id) {
            found = true;
            this.site.employees[i] = emp;
          }
        }
      } else {
        this.site.employees = [];
      }
      if (!found) {
        this.site.employees.push(emp);
      }
      this.siteChanged.emit(this.site);
    }
  }

  siteUpdated(iSite: Site) {
    this.site = new Site(iSite);
    this.siteChanged.emit(this.site);
  }
}
