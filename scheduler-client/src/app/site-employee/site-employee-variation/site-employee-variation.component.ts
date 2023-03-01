import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Variation } from 'src/app/models/employees/assignments';
import { Employee, IEmployee } from 'src/app/models/employees/employee';

@Component({
  selector: 'app-site-employee-variation',
  templateUrl: './site-employee-variation.component.html',
  styleUrls: ['./site-employee-variation.component.scss']
})
export class SiteEmployeeVariationComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setVariationLists();
  }
  get employee(): Employee {
    return this._employee;
  }
  @Output() changed = new EventEmitter<Employee>();

  variations: Variation[] = [];

  constructor() {}

  setVariationLists() {
    const now = new Date();
    this.variations = [];
    let count = 0;
    this.employee.data.variations.forEach(v => {
      const vari = new Variation(v);
      if (vari.enddate.getTime() >= now.getTime()) {
        this.variations.push(vari)
      }
    });
    this.variations.sort((a,b) => a.compareTo(b));
  }

  dateString(date: Date): string {
    const months: string[] = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  getLabel(vari: Variation) {
    let answer = '';
    if (vari.mids) {
      answer += '(MIDS) ';
    } else {
      answer += '(OTHER) ';
    }
    answer += `${this.dateString(vari.startdate)}-${this.dateString(vari.enddate)}`;
    return answer;
  }
}
