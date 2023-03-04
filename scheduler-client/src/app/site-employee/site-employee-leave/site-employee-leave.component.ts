import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { LeaveDay } from 'src/app/models/employees/leave';

@Component({
  selector: 'app-site-employee-leave',
  templateUrl: './site-employee-leave.component.html',
  styleUrls: ['./site-employee-leave.component.scss']
})
export class SiteEmployeeLeaveComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setLeaves();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  year: number;
  leaveDays: LeaveDay[];

  constructor() { 
    this.year = (new Date()).getFullYear();
    this.leaveDays = [];
  }

  setLeaves() {
    this.leaveDays = [];
    const start = new Date(Date.UTC(this.year, 0, 1));
    const end = new Date(Date.UTC(this.year + 1, 0, 1));
    this.employee.data.leaves.forEach(lv => {
      if (lv.leavedate.getTime() >= start.getTime() 
        && lv.leavedate.getTime() < end.getTime()) {
        this.leaveDays.push(new LeaveDay(lv));
      }
    });
    this.leaveDays.sort((a,b) => b.compareTo(a));
  }

  updateYear(direction: string) {
    if (direction.substring(0,1).toLowerCase() === 'u') {
      this.year++;
    } else {
      this.year--;
    }
    this.setLeaves();
  }
}
