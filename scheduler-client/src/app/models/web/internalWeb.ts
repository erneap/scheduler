import { supportsPassiveEventListeners } from "@angular/cdk/platform";
import { IVariation, IWorkday, Variation, Workday } from "../employees/assignments";
import { Employee, IEmployee } from "../employees/employee";
import { HttpErrorResponse } from "@angular/common/http";
import { throwError } from "rxjs";
import { Router } from "@angular/router";
import { INotification } from "../employees/notification";

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

export class IngestManualChange {
  employeeid: string;
  changedate: Date;
  changevalue: string;

  constructor(id: string, date: Date, value: string) {
    this.employeeid = id;
    this.changedate = new Date(date);
    this.changevalue = value;
  }
}

export function handleError(error: HttpErrorResponse) {
  let message = "";
  // need to transform HTML error messages to JSON type by extracting only the
  // body of the message without any other markup.
  if (error.error.exception) {
    message = error.error.exception;
  } else if (typeof(error.error) ===  'string') {
    if (error.error.indexOf('<body>') >= 0) {
      let spos = error.error.indexOf('<body>') + 6;
      let epos = error.error.indexOf('</body>');
      message = error.error.substring(spos, epos).trim();
      if (message.indexOf('<pre>') >= 0) {
        spos = message.indexOf('<pre>') + 5;
        epos = message.indexOf('</pre>');
        message = message.substring(spos, epos);
      }
    }
  } else {
    message = error.error;
  }
  if (message !== '') {
    if (error.status === 0) {
      message = `Client Error: ${message}`;
    } else {
      message = `Server Error: Code: ${error.status} - ${message}`;
    }
  }
  return throwError(() => new Error(message));
}

export interface MessageRequest {
  to: string;
  from: string;
  message: string;
}

export interface NotificationAck {
  messages: string[];
}

export interface NotificationResponse {
  messages: INotification[];
  exception: string;
}