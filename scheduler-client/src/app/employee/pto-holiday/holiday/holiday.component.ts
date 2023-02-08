import { Component, Host, Input } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { Employee } from 'src/app/models/employees/employee';
import { CompanyHoliday } from 'src/app/models/teams/company';
import { Team } from 'src/app/models/teams/team';
import { EmployeeService } from 'src/app/services/employee.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-pto-holiday-holiday',
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent {
  private _year: number = (new Date()).getFullYear();
  @Input() 
  public set year(yr: number) {
    this._year = yr;
    this.setHolidays();
  } 
  get year(): number {
    return this._year;
  }
  holidays: CompanyHoliday[] = [];

  constructor(
    protected empService: EmployeeService,
    protected teamService: TeamService
  ) {
    this.setHolidays();
  }

  setHolidays() {
    this.holidays = [];
    const iEmp = this.empService.getEmployee();
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
    this.holidays.forEach(hol => {
      let holTotal = 0.0;
      hol.leaveDays.forEach(lv => {
        if (lv.status.toLowerCase() === 'actual') {
          holTotal += lv.hours;
        }
      });
      if (holTotal >= 8.0) {
        total++;
      }
    });
    total = this.holidays.length - total;
    return total.toFixed(0);
  }

  getHolidaysHoursRemaining(): string {
    let total = this.holidays.length * 8.0;
    this.holidays.forEach(hol => {
      hol.leaveDays.forEach(lv => {
        if (lv.status.toLowerCase() === 'actual') {
          total -= lv.hours;
        }
      });
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
}
