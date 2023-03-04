import { supportsPassiveEventListeners } from "@angular/cdk/platform";
import { IVariation, IWorkday, Variation, Workday } from "../employees/assignments";
import { Employee, IEmployee } from "../employees/employee";

export class WorkWeek {
  private week: Workday[];
  public id: number = 0

  constructor(id: number) {
    this.id = id;
    this.week = [];
    for (let i=0; i < 7; i++) {
      const wd: Workday = new Workday();
      wd.date = new Date();
      wd.id = i;
    }
  }

  setWorkday(wd: IWorkday, date?: Date) {
    const wDay = new Workday(wd);
    if (date) {
      wDay.date = new Date(date);
    }
    const id = wDay.id % 7;
    this.week[id] = wDay;
    this.week.sort((a,b) => a.compareTo(b));
  }

  getWorkday(id: number): Workday {
    return this.week[id];
  }

  getWorkdays(): Workday[] {
    return this.week;
  }

  compareTo(other: WorkWeek): number {
    return (this.id < other.id) ? -1 : 1;
  }
}

export class WebEmployeeVariation {
  employee: Employee;
  variation: Variation;

  constructor(emp: IEmployee, vari: IVariation) {
    this.employee = new Employee(emp);
    this.variation = new Variation(vari);
  }

  compareTo(other?: WebEmployeeVariation): number {
    if (other) {
      if (this.variation.startdate.getTime() === other.variation.startdate.getTime()) {
        if (this.variation.enddate.getTime() === other.variation.enddate.getTime()) {
          return this.employee.compareTo(other.employee);
        }
        return (this.variation.enddate.getTime() 
          < other.variation.enddate.getTime()) ? -1 : 1;
      }
      return (this.variation.startdate.getTime() 
        < other.variation.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }
}