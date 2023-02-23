import { Assignment, IAssignment, IVariation, Variation, Workday } from "./assignments";
import { CompanyInfo, ICompanyInfo } from "./company";
import { AnnualLeave, IAnnualLeave, ILeaveDay, ILeaveRequest, LeaveDay, LeaveRequest } from "./leave";

export interface IEmployeeName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
}

export class EmployeeName implements IEmployeeName {
  first: string;
  middle: string;
  last: string;
  suffix: string;

  constructor(name?: IEmployeeName) {
    this.first = (name) ? name.first : '';
    this.middle = (name) ? name.middle : '';
    this.last = (name) ? name.last : '';
    this.suffix = (name) ? name.suffix : '';
  }

  getFullName(): string {
    let answer = `${this.first} `
    if (this.middle !== '') {
      answer += `${this.middle.substring(0,1)}. `
    }
    answer += `${this.last}`
    return answer;
  }

  getLastFirst(): string {
    return `${this.last}, ${this.first}`;
  }
}

export interface IEmployeeLaborCode {
  chargeNumber: string;
  extension: string;
}

export class EmployeeLaborCode implements IEmployeeLaborCode {
  chargeNumber: string;
  extension: string;

  constructor(lc?: IEmployeeLaborCode) {
    this.chargeNumber = (lc) ? lc.chargeNumber : '';
    this.extension = (lc) ? lc.extension : '';
  }

  compareTo(other?: EmployeeLaborCode): number {
    if (other) {
      if (this.chargeNumber === other.chargeNumber) {
        return (this.extension < other.extension) ? -1 : 1;
      }
      return (this.chargeNumber < other.chargeNumber) ? -1 : 1;
    }
    return -1;
  }
}

export interface IEmployeeData {
  companyinfo: ICompanyInfo;
  assignments: IAssignment[];
  variations: IVariation[];
  balance: IAnnualLeave[];
  leaves: ILeaveDay[];
  requests: ILeaveRequest[];
  laborCodes: IEmployeeLaborCode[];
}

export class EmployeeData implements IEmployeeData {
  companyinfo: CompanyInfo;
  assignments: Assignment[];
  variations: Variation[];
  balance: AnnualLeave[];
  leaves: LeaveDay[];
  requests: LeaveRequest[];
  laborCodes: EmployeeLaborCode[];

  constructor(ed?: IEmployeeData) {
    this.companyinfo = (ed) ? new CompanyInfo(ed.companyinfo) : new CompanyInfo();
    this.assignments = [];
    if (ed && ed.assignments && ed.assignments.length > 0) {
      ed.assignments.forEach(asgmt => {
        this.assignments.push(new Assignment(asgmt));
      });
      this.assignments.sort((a,b) => a.compareTo(b))
    }
    this.variations = [];
    if (ed && ed.variations && ed.variations.length > 0) {
      ed.variations.forEach(vari => {
        this.variations.push(new Variation(vari));
      });
      this.variations.sort((a,b) => a.compareTo(b));
    }
    this.balance = [];
    if (ed && ed.balance && ed.balance.length > 0) {
      ed.balance.forEach(bal => {
        this.balance.push(new AnnualLeave(bal));
      });
      this.balance.sort((a,b) => a.compareTo(b));
    }
    this.leaves = [];
    if (ed && ed.leaves && ed.leaves.length > 0) {
      ed.leaves.forEach(lv => {
        this.leaves.push(new LeaveDay(lv));
      });
      this.leaves.sort((a,b) => a.compareTo(b));
    }
    this.requests = [];
    if (ed && ed.requests && ed.requests.length > 0) {
      ed.requests.forEach(req => {
        this.requests.push(new LeaveRequest(req));
      });
      this.requests.sort((a,b) => a.compareTo(b));
    }
    this.laborCodes = [];
    if (ed && ed.laborCodes && ed.laborCodes.length > 0) {
      ed.laborCodes.forEach(lc => {
        this.laborCodes.push(new EmployeeLaborCode(lc));
      });
      this.laborCodes.sort((a,b) => a.compareTo(b));
    }
  }

  isAssigned(site: string, wkctr: string, start: Date, end: Date): boolean {
    let answer = false;
    this.assignments.forEach(asgmt => {
      if (site.toLowerCase() === asgmt.site.toLowerCase()
        && wkctr.toLowerCase() === asgmt.workcenter.toLowerCase()
        && asgmt.startDate.getTime() <= end.getTime()
        && asgmt.endDate.getTime() >= start.getTime()) {
        answer = true;
      }
    });
    return answer;
  }

  atSite(site: string, start: Date, end: Date): boolean {
    let answer = false;
    this.assignments.forEach(asgmt => {
      if (site.toLowerCase() === asgmt.site.toLowerCase()
        && asgmt.startDate.getTime() <= end.getTime()
        && asgmt.endDate.getTime() >= start.getTime()) {
        answer = true;
      }
    });
    return answer;
  }

  getWorkday(site: string, date: Date): Workday {
    let answer: Workday = new Workday();
    let stdHours: number = 8.0;
    this.assignments.sort((a,b) => a.compareTo(b));
    this.variations.sort((a,b) => a.compareTo(b));
    this.assignments.forEach(asgmt => {
      let wd = asgmt.getWorkday(site, date);
      if (wd) {
        answer = new Workday(wd);
      }
      if (asgmt.useAssignment(site, date)) {
        stdHours = asgmt.getStandardWorkHours();
      }
    });
    this.variations.forEach(vari => {
      let wd = vari.getWorkday(site, date);
      if (wd) {
        answer = new Workday(wd);
      }
    });
    this.leaves.forEach(lv => {
      if (lv.leavedate.getFullYear() === date.getFullYear()
        && lv.leavedate.getMonth() === date.getMonth()
        && lv.leavedate.getDate() === date.getDate()
        && lv.hours >= stdHours) {
        answer.code = lv.code;
        answer.hours = lv.hours;
        answer.workcenter = '';
      }
    });
    return answer;
  }

  getWorkdayWOLeaves(site: string, date: Date): Workday {
    let answer: Workday = new Workday();
    let stdHours: number = 8.0;
    this.assignments.sort((a,b) => a.compareTo(b));
    this.variations.sort((a,b) => a.compareTo(b));
    this.assignments.forEach(asgmt => {
      let wd = asgmt.getWorkday(site, date);
      if (wd) {
        answer = new Workday(wd);
      }
      if (asgmt.useAssignment(site, date)) {
        stdHours = asgmt.getStandardWorkHours();
      }
    });
    this.variations.forEach(vari => {
      let wd = vari.getWorkday(site, date);
      if (wd) {
        answer = new Workday(wd);
      }
    });
    return answer;
  }

  getStandardWorkday(site: string, date: Date): number {
    let answer = 8;
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(site, date)) {
        answer = asgmt.getStandardWorkHours();
      }
    });
    return answer;
  }
}

export interface IEmployee {
  id: string;
  team: string;
  site: string;
  email: string;
  name: IEmployeeName;
  data: IEmployeeData;
}

export class Employee implements IEmployee {
  id: string;
  team: string;
  site: string;
  email: string;
  name: EmployeeName;
  data: EmployeeData;

  constructor(emp?: IEmployee) {
    this.id = (emp) ? emp.id : '';
    this.team = (emp) ? emp.team : '';
    this.site = (emp) ? emp.site : '';
    this.email = (emp) ? emp.email : '';
    this.name = (emp) ? new EmployeeName(emp.name) : new EmployeeName();
    this.data = (emp) ? new EmployeeData(emp.data) : new EmployeeData();
  }

  compareTo(other?: Employee): number {
    if (other) {
      if (this.name.last === other.name.last) {
        if (this.name.first === other.name.first) {
          return (this.name.middle < this.name.middle) ? -1 : 1;
        }
        return (this.name.first < other.name.first) ? -1 : 1;
      }
      return (this.name.last < other.name.last) ? -1 : 1;
    }
    return -1;
  }

  isActive(): boolean {
    const now = new Date();
    return this.data.atSite(this.site, now, now);
  }
}