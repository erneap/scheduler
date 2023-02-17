import { Component, Input } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveGroup, LeaveMonth } from 'src/app/models/employees/leave';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-pto-overall',
  templateUrl: './pto.component.html',
  styleUrls: ['./pto.component.scss']
})
export class PtoComponent {
  private _year: number = (new Date()).getFullYear();
  private _employee: Employee | undefined;
  @Input()
  public set year(yr: number) {
    this._year = yr;
    this.setYear();
  }
  get year(): number {
    return this._year;
  }
  @Input()
  public set employee(emp: IEmployee) {
    this._employee = new Employee(emp);
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
  }
  get employeeid(): string {
    if (this._employee) {
      return this._employee.id;
    }
    return '';
  }
  leaveMonths: LeaveMonth[];
  actual: number = 0.0
  requested: number = 0.0;
  annual: number = 0.0;
  carryover: number = 0.0;
  balance: number = 0.0;
  balanceStyle: string = "balancepos";

  constructor(
    protected empService: EmployeeService,
    protected siteService: SiteService
  ) {
    this.leaveMonths = [];
    this._employee = this.empService.getEmployee();
    this.setYear();
  }

  setYear() {
    this.leaveMonths = [];
    this.actual = 0.0;
    this.requested = 0.0;
    this.annual = 0.0;
    this.carryover = 0.0;
    this.balance = 0.0;
    this.balanceStyle = "balancepos";
    for (let i=0; i < 12; i++) {
      let month = new LeaveMonth();
      month.month = new Date(Date.UTC(this._year, i, 1));
      this.leaveMonths.push(month);
    }
    const emp = this.employee;
    if (emp && emp.data && emp.data.leaves.length > 0) {
      emp.data.leaves.sort((a,b) => a.compareTo(b));
      emp.data.leaves.forEach(lv => {
        if (lv.code.toLowerCase() !== 'h' 
        && lv.leavedate.getFullYear() === this.year) {
          // first get the leave month for to display in:
          this.leaveMonths.forEach(lm => {
            if (lm.month.getMonth() === lv.leavedate.getMonth()) {
              if (lm.leaveGroups.length > 0) {
                const lg = lm.leaveGroups[lm.leaveGroups.length - 1];
                lg.leaves.sort((a,b) => a.compareTo(b));
                const ld = lg.leaves[lg.leaves.length - 1];
                if (ld.code.toLowerCase() === lv.code.toLowerCase() 
                  && ld.status.toLowerCase() === lv.status.toLowerCase() 
                  && lv.leavedate.getDate() === ld.leavedate.getDate() + 1) {
                  lg.addLeave(lv);
                  lm.leaveGroups[lm.leaveGroups.length - 1] = lg;
                } else {
                  const lg = new LeaveGroup();
                  lg.addLeave(lv);
                  lm.leaveGroups.push(lg);
                  lm.leaveGroups.sort((a,b) => a.compareTo(b));
                }
              } else {
                const lg = new LeaveGroup();
                lg.addLeave(lv);
                lm.leaveGroups.push(lg);
                lm.leaveGroups.sort((a,b) => a.compareTo(b));
              }
            } 
          });
          // next add PTO/Vacation to actuals and requested totals
          if (lv.code.toLowerCase() === 'v') {
            if (lv.status.toLowerCase() === 'actual') {
              this.actual += lv.hours;
            } else {
              this.requested += lv.hours;
            }
          }
        }
      });
      emp.data.balance.forEach(bal => {
        if (bal.year === this._year) {
          this.annual = bal.annual;
          this.carryover = bal.carryover;
          this.balance = (this.annual + this.carryover) 
            - (this.actual + this.requested);
          if (this.balance < 0) {
            this.balanceStyle = "balanceneg";
          }
        }
      });
    }
  }
}