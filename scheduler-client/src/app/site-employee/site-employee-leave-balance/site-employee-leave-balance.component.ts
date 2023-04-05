import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { AnnualLeave } from 'src/app/models/employees/leave';
import { ISite, Site } from 'src/app/models/sites/site';
import { EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { SiteResponse } from 'src/app/models/web/siteWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-employee-leave-balance',
  templateUrl: './site-employee-leave-balance.component.html',
  styleUrls: ['./site-employee-leave-balance.component.scss']
})
export class SiteEmployeeLeaveBalanceComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setAnnualLeaves();
  }
  get employee(): Employee {
    return this._employee;
  }
  private _site: Site = new Site();
  @Input()
  public set site(iSite: ISite) {
    this._site = new Site(iSite);
  }
  get site(): Site {
    return this._site;
  }
  @Output() changed = new EventEmitter<Employee>();
  @Output() siteChanged = new EventEmitter<Site>();

  balances: AnnualLeave[] = [];

  constructor(
    protected authService: AuthService,
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
  ) { }

  employeeChanged(emp: Employee) {
    this.changed.emit(new Employee(emp));
  }

  setAnnualLeaves() {
    this.balances = [];
    this.employee.data.balance.forEach(bal => {
      this.balances.push(new AnnualLeave(bal));
    });
    this.balances.sort((a,b) => b.compareTo(a));
  }

  AddLeaveBalance() {
    const now = new Date();
    this.dialogService.showSpinner();
    this.authService.statusMessage = "Adding New Leave Balance"
    this.empService.createLeaveBalance(this.employee.id, now.getFullYear())
    .subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: EmployeeResponse | null = resp.body;
        if (data && data !== null) {
          if (data.employee) {
            this.employee = new Employee(data.employee);
            this.setAnnualLeaves();
          }
        }
        this.changed.emit(new Employee(this.employee));
        this.authService.statusMessage = "Update complete";
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.error.exception;
      }
    })
  }

  addAllBalances() {
    const now = new Date();
    const team = this.teamService.getTeam();
    if (this.site && team) { 
      this.dialogService.showSpinner();
      this.authService.statusMessage = "Adding New Leave Balance"
      this.empService.createAllLeaveBalances(team.id, this.site.id, 
        now.getFullYear()).subscribe({
        next: resp => {
          this.dialogService.closeSpinner();
          if (resp.headers.get('token') !== null) {
            this.authService.setToken(resp.headers.get('token') as string);
          }
          const data: SiteResponse | null = resp.body;
          if (data && data !== null) {
            if (data.site) {
              this.siteService.setSite(data.site);
              this.siteChanged.emit(new Site(data.site));
            }
          }
          this.authService.statusMessage = "Update complete";
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.error.exception;
        }
      });
    }
  }
}
