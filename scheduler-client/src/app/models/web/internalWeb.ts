import { supportsPassiveEventListeners } from "@angular/cdk/platform";
import { IWorkday, Workday } from "../employees/assignments";

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