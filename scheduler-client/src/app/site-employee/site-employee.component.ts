import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListItem } from '../generic/button-list/listitem';
import { Employee } from '../models/employees/employee';
import { ISite, Site } from '../models/sites/site';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog-service.service';
import { EmployeeService } from '../services/employee.service';
import { SiteService } from '../services/site.service';
import { TeamService } from '../services/team.service';

@Component({
  selector: 'app-site-employee',
  templateUrl: './site-employee.component.html',
  styleUrls: ['./site-employee.component.scss']
})
export class SiteEmployeeComponent {
  private _site: Site = new Site();
  @Input()
  public set site(site: ISite) {
    this._site = new Site(site);
    this.setEmployees();
  }
  get site(): Site {
    return this._site;
  }
  items: ListItem[] = [];
  activeOnly: boolean = true;
  selected: string = '';
  employee: Employee = new Employee();

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected empService: EmployeeService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected router: Router,
    protected activeRouter: ActivatedRoute
  ) {
    if (this.site.id === '') {
      const site = this.siteService.getSite();
      if (site) {
        this._site = new Site(site);
      }
    }
    this.setEmployees();
    let iEmp = this.siteService.getSelectedEmployee();
    if (iEmp) {
      this.selected = iEmp.id;
      this.employee = new Employee(iEmp);
    } else {
      iEmp = this.empService.getEmployee()
      if (iEmp) {
        this.selected = iEmp.id;
        this.employee = new Employee(iEmp);
      }
    }
    this.authService.section = 'siteemployees';
  }

  setEmployees() {
    this.items = [];
    if (this.site.employees) {
      this.site.employees.forEach(iEmp => {
        const emp = new Employee(iEmp);
        if ((emp.isActive() && this.activeOnly) || !this.activeOnly) {
          this.items.push(new ListItem(emp.id, emp.name.getLastFirst()));
        }
      });
    }
  }

  setActiveOnly(checked: boolean) {
    this.activeOnly = checked;
    this.setEmployees();
  }

  onSelect(eid: string) {
    this.selected = eid;
    const site = this.siteService.getSite();
    if (site) {
      if (site.employees) {
        site.employees.forEach(iEmp => {
          if (iEmp.id === eid) {
            this.employee = new Employee(iEmp);
            this.siteService.setSelectedEmployee(iEmp);
          }
        });
      }
    }
  }

  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  siteChanged(site: Site) {
    this.setEmployees();
  }
}
