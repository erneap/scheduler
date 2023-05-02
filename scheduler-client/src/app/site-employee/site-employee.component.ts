import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListItem } from '../generic/button-list/listitem';
import { Employee } from '../models/employees/employee';
import { ISite, Site } from '../models/sites/site';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog-service.service';
import { EmployeeService } from '../services/employee.service';
import { SiteService } from '../services/site.service';
import { TeamService } from '../services/team.service';
import { Team } from '../models/teams/team';

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
  @Output() siteChanged = new EventEmitter<Site>();
  employees: ListItem[] = [];
  activeOnly: boolean = true;
  selected: string = 'new';
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
    const site = this.siteService.getSite();
    if (site) {
      this.site = site;
    }
    const emp = this.empService.getEmployee();
    if (emp) {
      this.employee = new Employee(emp);
      this.selected = this.employee.id;
    }
  }

  setEmployees() {
    this.employees = [];
    this.employees.push(new ListItem('new', 'Add New Employee'));
    if (this.site.employees) {
      this.site.employees.forEach(iEmp => {
        const emp = new Employee(iEmp)
        if ((this.activeOnly && emp.isActive()) || !this.activeOnly) {
          this.employees.push(new ListItem(emp.id, emp.name.getLastFirst()));
        } 
      });
    }
  }

  getListStyle(): string {
    const screenHeight = window.innerHeight;
    let listHeight = (this.employees.length * 30) + 65;
    if ((screenHeight - 130) < listHeight) {
      listHeight = screenHeight - 130;
    }
    return `height: ${listHeight}px;`;
  }

  onSelect(id: string) {
    this.selected = id;
    if (this.site.employees) {
      this.site.employees.forEach(iEmp => {
        if (iEmp.id === this.selected) {
          this.employee = new Employee(iEmp);
        }
      });
    }
  }

  getButtonClass(id: string) {
    if (this.selected === id) {
      return "employee selected";
    } else {
      let answer = "employee ";
      const now = new Date();
      if (this.site.employees) {
        this.site.employees.forEach(iEmp => {
          if (iEmp.id === id) {
            const emp = new Employee(iEmp);
            if (emp.user && emp.user.passwordExpires.getTime() < now.getTime()) {
              answer += "expired";
            } else if (emp.user && emp.user.badAttempts > 2) {
              answer += "locked"
            } else {
              answer += "active"
            }
          }
        });
      }
      return answer;
    }
  }

  changeActiveOnly() {
    this.setEmployees();
  }

  siteUpdated(site: Site) {
    this.siteChanged.emit(site);
    const iSite = this.siteService.getSite();
    if (iSite && iSite.id === site.id) {
      this.siteService.setSite(site)
    }
    this.teamService.setSelectedSite(site);
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      if (team.sites) {
        for (let i=0; i < team.sites.length; i++) {
          if (team.sites[i].id === site.id) {
            team.sites[i] = site;
          }
        }
      }
    }
    this.site = new Site(site);
    this.setEmployees();
  }

  newEmployeeChange(id: string) {
    this.selected = id;
  }
}
