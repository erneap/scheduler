export interface IAnnualLeave {
  year: number;
  annual: number;
  carryover: number;
}

export class AnnualLeave implements IAnnualLeave {
  year: number;
  annual: number;
  carryover: number;

  constructor(al?: IAnnualLeave) {
    this.year = (al) ? al.year : 0
    this.annual = (al) ? al.annual : 0.0;
    this.carryover = (al) ? al.carryover : 0.0;
  }

  compareTo(other?: IAnnualLeave): number {
    if (other) {
      return (this.year < other.year) ? -1 : 1;
    }
    return -1;
  }
}

export interface ILeaveDay {
  id: number;
  leavedate: Date;
  code: string;
  hours: number;
  status: string;
  requestid: string;
}

export class LeaveDay implements ILeaveDay {
  id: number;
  leavedate: Date;
  code: string;
  hours: number;
  status: string;
  requestid: string;

  constructor(ld?: ILeaveDay) {
    this.id = (ld) ? ld.id : 1;
    this.leavedate = (ld) ? new Date(ld.leavedate) : new Date();
    this.code = (ld) ? ld.code : '';
    this.hours = (ld) ? ld.hours : 0.0;
    this.status = (ld) ? ld.status : "REQUESTED";
    this.requestid = (ld) ? ld.requestid : '';
  }

  compareTo(other?: LeaveDay): number {
    if (other) {
      if (this.leavedate.getTime() === other.leavedate.getTime()) {
        if (this.hours === other.hours) {
          return (this.code < other.code) ? -1 : 1;
        }
        return (this.hours < other.hours) ? -1 : 1
      }
      return (this.leavedate.getTime() < other.leavedate.getTime()) ? -1 : 1;
    }
    return -1;
  }
}

export interface ILeaveRequest {
  id: string;
  employeeid: string;
  requestDate: Date;
  primarycode: string;
  startdate: Date;
  enddate: Date;
  status: string;
  approvedby: string;
  approvalDate: Date;
  requesteddays: ILeaveDay[];
}

export class LeaveRequest implements ILeaveRequest {
  id: string;
  employeeid: string;
  requestDate: Date;
  primarycode: string;
  startdate: Date;
  enddate: Date;
  status: string;
  approvedby: string;
  approvalDate: Date;
  requesteddays: LeaveDay[];

  constructor(lr?: ILeaveRequest) {
    this.id = (lr) ? lr.id : '';
    this.employeeid = (lr) ? lr.employeeid : '';
    this.requestDate = (lr) ? new Date(lr.requestDate) : new Date();
    this.primarycode = (lr) ? lr.primarycode : 'V';
    this.startdate = (lr) ? new Date(lr.startdate) : new Date();
    this.enddate = (lr) ? new Date(lr.enddate) : new Date();
    this.status = (lr) ? lr.status : 'REQUESTED';
    this.approvedby = (lr) ? lr.approvedby : '';
    this.approvalDate = (lr) ? new Date(lr.approvalDate) : new Date(0);
    this.requesteddays = [];
    if (lr && lr.requesteddays && lr.requesteddays.length > 0) {
      lr.requesteddays.forEach(rd => {
        this.requesteddays.push(new LeaveDay(rd))
      });
      this.requesteddays.sort((a,b) => a.compareTo(b))
    }
  }

  compareTo(other?: LeaveRequest): number {
    if (other) {
      if (this.requestDate.getTime() === other.requestDate.getTime()) {
        if (this.startdate.getTime() === other.startdate.getTime()) {
          return (this.enddate.getTime() < other.enddate.getTime()) ? -1 : 1;
        }
        return (this.startdate.getTime() < other.startdate.getTime()) ? -1 : 1;
      }
      return (this.requestDate.getTime() < other.requestDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  setLeaveDay(date: Date, code: string, hours: number) {
    let found = false;
    for (let i = 0; i < this.requesteddays.length && !found; i++) {
      if (this.requesteddays[i].leavedate.getTime() === date.getTime()) {
        found = true;
        this.requesteddays[i].code = code;
        this.requesteddays[i].hours = hours;
        this.requesteddays[i].status = "REQUESTED";
        this.status = "REQUESTED";
      }
    }
  }
}

export class LeaveGroup {
  leaves: LeaveDay[];

  constructor(gp?: LeaveGroup) {
    this.leaves = [];
    if (gp) {
      gp.leaves.forEach(lv => {
        this.leaves.push(new LeaveDay(lv));
      });
      this.leaves.sort((a,b) => a.compareTo(b))
    }
  }

  getCode(): string {
    if (this.leaves.length > 0) {
      return this.leaves[0].code;
    }
    return "";
  }

  getLastDate(): number {
    if (this.leaves.length > 0) {
      return this.leaves[this.leaves.length - 1].leavedate.getDate();
    }
    return 0;
  }

  getFirstDate(): number {
    if (this.leaves.length > 0) {
      return this.leaves[0].leavedate.getDate();
    }
    return 0;
  }

  addLeave(lv: ILeaveDay) {
    this.leaves.push(new LeaveDay(lv));
  }

  compareTo(other?: LeaveGroup): number {
    if (other) {
      if (this.getFirstDate() !== 0 && other.getFirstDate() !== 0) {
        return (this.getFirstDate() < other.getFirstDate()) ? -1 : 1;
      } else if (this.getFirstDate() === 0) {
        return 1;
      } else {
        return -1;
      }
    }
    return -1;
  }
}

export class LeaveMonth {
  month: Date;
  active: Boolean;
  leaveGroups: LeaveGroup[];

  constructor(lm?: LeaveMonth) {
    this.month = (lm) ? new Date(lm.month) : new Date();
    this.active = (lm) ? lm.active : true;
    this.leaveGroups = [];
    if (lm && lm.leaveGroups.length > 0) {
      lm.leaveGroups.forEach(lg => {
        this.leaveGroups.push(lg);
      });
      this.leaveGroups.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: LeaveMonth): number {
    if (other) {
      return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
    }
    return -1;
  }
}