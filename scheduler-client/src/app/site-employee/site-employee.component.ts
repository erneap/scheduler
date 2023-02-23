import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListItem } from '../generic/button-list/listitem';
import { Employee } from '../models/employees/employee';
import { AuthService } from '../services/auth.service';
import { EmployeeService } from '../services/employee.service';
import { SiteService } from '../services/site.service';

@Component({
  selector: 'app-site-employee',
  templateUrl: './site-employee.component.html',
  styleUrls: ['./site-employee.component.scss']
})
export class SiteEmployeeComponent {
  items: ListItem[] = [];
  activeOnly: boolean = true;
  selected: string = '';

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected empService: EmployeeService,
    protected router: Router,
    protected activeRouter: ActivatedRoute
  ) {
    this.setEmployees();
    let iEmp = this.siteService.getSelectedEmployee();
    if (iEmp) {
      this.selected = iEmp.id;
    } else {
      iEmp = this.empService.getEmployee()
      if (iEmp) {
        this.selected = iEmp.id;
      }
    }
    this.authService.section = 'siteemployees';
  }

  setEmployees() {
    this.items = [];
    const site = this.siteService.getSite();
    if (site && site.employees) {
      site.employees.forEach(iEmp => {
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
            this.siteService.setSelectedEmployee(iEmp);
            window.location.reload();
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
}
