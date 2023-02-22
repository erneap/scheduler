import { Component } from '@angular/core';
import { ListItem } from '../generic/button-list/listitem';
import { Employee } from '../models/employees/employee';
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
    protected siteService: SiteService
  ) {
    this.setEmployees();
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
  }
}
