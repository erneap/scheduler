import { Component, Input } from '@angular/core';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { Employee } from 'src/app/models/employees/employee';
import { LeaveRequest } from 'src/app/models/employees/leave';
import { ISite, Site } from 'src/app/models/sites/site';
import { Team } from 'src/app/models/teams/team';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-employee-leave-request-approver',
  templateUrl: './site-employee-leave-request-approver.component.html',
  styleUrls: ['./site-employee-leave-request-approver.component.scss']
})
export class SiteEmployeeLeaveRequestApproverComponent {
  private _site: Site;
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
    this.setRequests();
  }
  get site(): Site {
    return this._site;
  }
  requests: ListItem[] = [];
  selected: string = '';
  requestEmployee: Employee = new Employee();
  request: LeaveRequest = new LeaveRequest();
  workcenter: string = '';

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) {
    const iSite = this.siteService.getSite();
    if (iSite) {
      this._site = new Site(iSite);
    } else {
      this._site = new Site();
    }
    this.setRequests();
  }

  getDateString(dt: Date): string {
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
  }

  setRequests() {
    this.requests = [];
    const now = new Date();
    const iUser = this.authService.getUser();
    if (iUser && this.site.employees) {
      this.site.employees.forEach(emp => {
        if (emp.id !== iUser.id) {
          if (emp.data.requests && emp.data.requests.length > 0) {
            let reqs = emp.data.requests.sort((a,b) => b.compareTo(a));
            reqs.forEach(req => {
              if (req.enddate.getTime() > now.getTime() 
              && req.approvedby === '') {
                let id = `${emp.id}|${req.id}`;
                let label = `${emp.name.last}: `
                  + `${this.getDateString(req.startdate)} - `
                  + `${this.getDateString(req.enddate)} (`
                  + `${req.primarycode.toUpperCase()})`;
                this.requests.push(new ListItem(id, label));
              }
            });
          }
        }
      });
    }
  }

  getButtonClass(id: string): string  {
    let answer = "employee";
    if (this.selected === id) {
      answer += ' active';
    }
    return answer;
  }

  onSelect(id: string) {
    this.selected = id;
    const parts = id.split("|");
    if (this.site.employees) {
      this.site.employees.forEach(emp => {
        if (emp.id === parts[0]) {
          if (emp.data.requests) {
            emp.data.requests.forEach(req => {
              if (req.id === parts[1]) {
                this.requestEmployee = new Employee(emp);
                this.request = new LeaveRequest(req);
                const wd = this.requestEmployee.data.getWorkdayWOLeaves(
                  this.site.id, this.request.startdate);
                this.workcenter = wd.workcenter;
              }
            });
          }
        }
      });
    }
  }

  employeeChanged(emp: Employee) {
    if (this.site.employees) {
      for (let i=0; i < this.site.employees.length; i++) {
        if (this.site.employees[i].id === emp.id) {
          this.site.employees[i] = emp;
          const iSite = this.siteService.getSite();
          if (iSite && iSite.id === this.site.id) {
            this.siteService.setSite(this.site);
          }
          this.teamService.setSelectedSite(new Site(this.site));
        }
      }
    }
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      if (team.sites) {
        for (let i=0; i < team.sites.length; i++) {
          if (team.sites[i].id === this.site.id) {
            team.sites[i] = this.site;
            this.teamService.setTeam(team);
          }
        }
      }
    }
    this.setRequests();
  }
 }
