import { Component, Input } from '@angular/core';
import { Employee, EmployeeLaborCode, IEmployee } from 'src/app/models/employees/employee';
import { LaborCode } from 'src/app/models/sites/laborcode';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-employee-labor-codes',
  templateUrl: './employee-labor-codes.component.html',
  styleUrls: ['./employee-labor-codes.component.scss']
})
export class EmployeeLaborCodesComponent {
  private _employee: Employee | undefined;
  @Input()
  public set employee(emp: IEmployee) {
    this._employee = new Employee(emp);
  }
  get employee(): Employee {
    if (this._employee) {
      return this._employee;
    } else {
      const emp = this.empService.getEmployee();
      if (emp) {
        this._employee = new Employee(emp);
        return this._employee;
      } else {
        return new Employee();
      }
    }
  }
  laborCodes: EmployeeLaborCode[] = [];
  siteLaborCodes: LaborCode[] = [];

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService,
    protected teamService: TeamService
  ) { }

  setLaborCodes() {
    this.laborCodes = [];
    this.siteLaborCodes = [];

    const now = new Date();
    const site = this.siteService.getSite();
    if (site && site.laborCodes && site.laborCodes.length > 0) {
      site.laborCodes.forEach(lc => {
        if (lc.endDate.getTime() >= now.getTime()) {
          this.siteLaborCodes.push(new LaborCode(lc));
        }
      })
    }
    this.siteLaborCodes.sort((a,b) => a.compareTo(b));

    this.employee.data.laborCodes.forEach(elc => {
      this.siteLaborCodes.forEach(slc => {
        if (elc.chargeNumber === slc.chargeNumber 
          && elc.extension === slc.extension) {
          this.laborCodes.push(new EmployeeLaborCode(elc));
        } 
      });
    });
    this.laborCodes.sort((a,b) => a.compareTo(b));
  }
}
