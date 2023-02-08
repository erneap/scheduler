import { Component } from '@angular/core';
import { Employee } from 'src/app/models/employees/employee';
import { Team } from 'src/app/models/teams/team';
import { EmployeeService } from 'src/app/services/employee.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-pto-holiday-overall',
  templateUrl: './pto-holiday.component.html',
  styleUrls: ['./pto-holiday.component.scss']
})
export class PtoHolidayComponent {
  year: number;
  showHolidays: boolean;

  constructor(
    protected empService: EmployeeService,
    protected teamService: TeamService
  ) {
    this.showHolidays = false;
    this.year = (new Date()).getFullYear();
    const iEmp = this.empService.getEmployee();
    const iTeam = this.teamService.getTeam();
    if (iEmp && iTeam) {
      const emp = new Employee(iEmp);
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === emp.data.companyinfo.company.toLowerCase()) {
          this.showHolidays = co.holidays.length > 0;
        }
      });
    }
  }

  updateYear(direction: string) {
    if (direction.substring(0,1).toLowerCase() === 'u') {
      this.year++;
    } else if (direction.substring(0,1).toLowerCase() === 'd') {
      this.year--;
    }
  }
}
