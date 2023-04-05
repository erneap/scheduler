import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { Employee } from 'src/app/models/employees/employee';
import { ISite, Site } from 'src/app/models/sites/site';
import { Team } from 'src/app/models/teams/team';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-team-site-employee-editor',
  templateUrl: './team-site-employee-editor.component.html',
  styleUrls: ['./team-site-employee-editor.component.scss']
})
export class TeamSiteEmployeeEditorComponent {
  private _site: Site = new Site();
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
    this.setEmployees();
  }
  get site(): Site {
    return this._site;
  }
  @Output() siteChanged = new EventEmitter<Site>()
  teamid: string;
  selected: string = 'new';
  employees: ListItem[] = [];
  employee: Employee = new Employee();
  activeOnly: boolean = true;

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      this.teamid = iTeam.id;
    } else {
      this.teamid = '';
    }
    const iSite = this.siteService.getSite();
    if (iSite) {
      this.site = iSite;
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
    let listHeight = (this.employees.length * 30) + 70;
    if ((screenHeight - 200) < listHeight) {
      listHeight = screenHeight - 200;
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
      return "employee active";
    }
    return "employee";
  }

  changeActiveOnly() {
    this.setEmployees();
  }

  siteUpdated(site: Site) {
    this.siteChanged.emit(site);
    this.setEmployees();
  }

  newEmployeeChange(id: string) {
    this.selected = id;
  }
}
