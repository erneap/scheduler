import { Component, Host, Input } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { CompanyHoliday } from 'src/app/models/teams/company';
import { Team } from 'src/app/models/teams/team';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-pto-holiday-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent {
  private _year: number = (new Date()).getFullYear();
  private _employee: Employee | undefined;
  @Input() 
  public set year(yr: number) {
    this._year = yr;
    this.setHolidays();
  } 
  get year(): number {
    return this._year;
  }
  @Input()
  public set employee(emp: IEmployee) {
    this._employee = new Employee(emp);
    this.setHolidays();
  }
  get employee(): Employee {
    if (this._employee) {
      return this._employee;
    } else {
      this._employee = this.empService.getEmployee();
      if (this._employee) {
        return this._employee;
      }
      return new Employee();
    }
  }
  @Input()
  public set employeeid(id: string) {
    if (id !== '') {
      const site = this.siteService.getSite();
      if (site && site.employees && site.employees.length > 0) {
        site.employees.forEach(emp => {
          if (emp.id === id) {
            this._employee = new Employee(emp);
          }
        })
      } 
    }
    if (!this._employee) {
      this._employee = this.empService.getEmployee()
    }
    this.setHolidays();
  }
  get employeeid(): string {
    if (this._employee) {
      return this._employee.id;
    }
    return '';
  }
  holidays: CompanyHoliday[] = [];

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) {
    this.setHolidays();
    this._employee = empService.getEmployee()
  }

  setHolidays() {
    this.holidays = [];
    const iEmp = this.employee;
    const iTeam = this.teamService.getTeam();
    if (iEmp && iTeam) {
      const emp = new Employee(iEmp);
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === emp.data.companyinfo.company.toLowerCase()) {
          if (co.holidays.length > 0) {
            co.holidays.forEach(hol => {
              this.holidays.push(new CompanyHoliday(hol));
            });
          }
        }
      });
      emp.data.leaves.forEach(lv => {
        if (lv.leavedate.getFullYear() === this.year 
          && lv.code.toLowerCase() === 'h') {
          if (lv.hours === 8.0) {
            let found = false;
            for (let i=0; i < this.holidays.length && !found; i++) {
              if (this.holidays[i].getLeaveDayTotalHours() === 0.0) {
                found = true;
                this.holidays[i].addLeaveDay(lv);
              }
            }
          } else if (lv.hours < 8.0) {
            let found = false;
            for (let i=0; i < this.holidays.length && !found; i++) {
              if (this.holidays[i].getLeaveDayTotalHours() + lv.hours <= 8.0) {
                found = true;
                this.holidays[i].addLeaveDay(lv);
              }
            }
          }
        }
      });
    }
  }

  getHolidaysRemaining(): string {
    let total = 0;
    let holidays = 0;
    this.holidays.forEach(hol => {
      if (this.isActive(hol)) {
        holidays++;
        let holTotal = 0.0;
        hol.leaveDays.forEach(lv => {
          if (lv.status.toLowerCase() === 'actual') {
            holTotal += lv.hours;
          }
        });
        if (holTotal >= 8.0) {
          total++;
        }
      }
    });
    total = holidays - total;
    return total.toFixed(0);
  }

  getHolidaysHoursRemaining(): string {
    let total = 0.0;
    this.holidays.forEach(hol => {
      if (this.isActive(hol)) {
        total += 8.0;
        hol.leaveDays.forEach(lv => {
          if (lv.status.toLowerCase() === 'actual') {
            total -= lv.hours;
          }
        });
      }
    });
    return total.toFixed(1);
  }

  getHolidayHoursTaken(): string {
    let total = 0.0;
    this.holidays.forEach(hol => {
      hol.leaveDays.forEach(lv => {
        if (lv.status.toLowerCase() === 'actual') {
          total += lv.hours;
        }
      });
    });
    return total.toFixed(1);
  }

  isActive(holiday: CompanyHoliday): boolean {
    this.employee.data.assignments.sort((a,b) => a.compareTo(b));
    const actual = holiday.getActual(this.year);
    const startasgmt = this.employee.data.assignments[0];
    const endasgmt = this.employee.data.assignments[
      this.employee.data.assignments.length - 1];
    if (actual) {
      return (actual.getTime() >= startasgmt.startDate.getTime() &&
        actual.getTime() <= endasgmt.endDate.getTime());
    }
    return true;
  }
}
