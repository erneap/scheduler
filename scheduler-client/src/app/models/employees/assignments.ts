export interface IWorkday {
  id: number;
  workcenter: string;
  code: string;
  hours: number;
}

export class Workday implements IWorkday {
  id: number;
  workcenter: string;
  code: string;
  hours: number;
  date?: Date;

  constructor(wd?: IWorkday) {
    this.id = (wd) ? wd.id : 0;
    this.workcenter = (wd) ? wd.workcenter : '';
    this.code = (wd) ? wd.code : '';
    this.hours = (wd) ? wd.hours : 0.0;
  }

  compareTo(other?: IWorkday): number {
    if (other) {
      if (this.id === other.id) {
        return (this.code < other.code) ? -1 : 1;
      }
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }
}

export interface ISchedule {
  id: number;
  workdays: IWorkday[];
}

export class Schedule implements ISchedule {
  id: number;
  workdays: Workday[];

  constructor(sch?: ISchedule) {
    this.id = (sch) ? sch.id : 0;
    this.workdays = [];
    if (sch) {
      sch.workdays.forEach(wd => {
        this.workdays.push(new Workday(wd));
      });
    }
  }

  compareTo(other?: ISchedule): number {
    return (other) ? ((this.id < other.id) ? -1 : (this.id > other.id) ? 1 : 0) : -1;
  }

  getWorkday(id: number): Workday | undefined {
    this.workdays.sort((a,b) => a.compareTo(b));
    if (id < this.workdays.length) {
      return this.workdays[id]
    }
    return undefined;
  }
}

export interface IAssignment {
  id: number;
  site: string;
  workcenter: string;
  startDate: Date;
  endDate: Date;
  schedules: ISchedule[];
  rotationdate: Date;
  rotationdays: number;
}

export class Assignment implements IAssignment {
  id: number;
  site: string;
  workcenter: string;
  startDate: Date;
  endDate: Date;
  schedules: Schedule[];
  rotationdate: Date;
  rotationdays: number;

  constructor(asgmt?: IAssignment) {
    this.id = (asgmt) ? asgmt.id : 0;
    this.site = (asgmt) ? asgmt.site : '';
    this.workcenter = (asgmt) ? asgmt.workcenter : '';
    this.startDate = (asgmt) ? new Date(asgmt.startDate) : new Date();
    this.endDate = (asgmt) ? new Date(asgmt.endDate) 
      : new Date(9999, 11, 30, 23, 59, 59);
    this.schedules = [];
    if (asgmt && asgmt.schedules.length > 0) {
      asgmt.schedules.forEach(sch => {
        this.schedules.push(new Schedule(sch));
      });
    }
    this.rotationdate = (asgmt) ? new Date(asgmt.rotationdate) : new Date(0);
    this.rotationdays = (asgmt) ? asgmt.rotationdays : 0;
  }

  compareTo(other?: IAssignment): number {
    if (other) {
      if (this.startDate.getTime() === other.startDate.getTime()) {
        return (this.endDate.getTime() < other.endDate.getTime()) ? -1 : 1;
      }
      return (this.startDate.getTime() < other.startDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  useAssignment(site: string, date: Date): boolean {
    return (this.site.toLowerCase() === site.toLowerCase() 
      && this.startDate.getTime() <= date.getTime() 
      && this.endDate.getTime() >= date.getTime());
  }

  getStandardWorkHours(): number {
    let count = 0;
    if (this.schedules.length > 0) {
      this.schedules[0].workdays.forEach(wd => {
        if (wd.code !== '') {
          count++;
        }
      });
    }
    if (count < 5) {
      return 10.0;
    }
    return 8.0;
  }

  getWorkday(site: string, date: Date): Workday | undefined {
    if (date.getTime() <= this.endDate.getTime() 
      && date.getTime() >= this.startDate.getTime()
      && this.site.toLowerCase() === site.toLowerCase()) {
      let start = new Date(this.startDate);
      while (start.getDay() != 6) {
        start = new Date(start.getTime() - (24 * 3600000));
      }
      let mSecs = date.getTime() - start.getTime();
      let days = Math.floor(mSecs / (24 * 3600000));
      if (this.schedules.length === 1 || this.rotationdays <= 0) {
        let iDay = days % this.schedules[0].workdays.length;
        return this.schedules[0].getWorkday(iDay);
      } else if (this.schedules.length > 1) {
        let schID = (days / this.rotationdays) % this.schedules.length
        let iDay = days % this.schedules[schID].workdays.length
        return this.schedules[schID].getWorkday(iDay)
      }
    }
    return undefined;
  }
}

export interface IVariation {
  id: number;
  site: string;
  mids: boolean;
  startdate: Date;
  enddate: Date;
  schedule: ISchedule;
}

export class Variation implements IVariation {
  id: number;
  site: string;
  mids: boolean;
  startdate: Date;
  enddate: Date;
  schedule: Schedule;

  constructor(vari?: IVariation) {
    this.id = (vari) ? vari.id : 0;
    this.site = (vari) ? vari.site : '';
    this.mids = (vari) ? vari.mids : false;
    this.startdate = (vari) ? new Date(vari.startdate) : new Date(0);
    this.enddate = (vari) ? new Date(vari.enddate) : new Date(0);
    this.schedule = (vari) ? new Schedule(vari.schedule) : new Schedule();
  }

  compareTo(other?: IVariation): number {
    if (other) {
      if (this.startdate.getTime() === other.startdate.getTime()) {
        return (this.enddate.getTime() < other.enddate.getTime()) ? -1 : 1;
      }
      return (this.startdate.getTime() < other.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  useVariation(site: string, date: Date): boolean {
    return (this.site === site && date.getTime() >= this.startdate.getTime() 
      && date.getTime() <= this.enddate.getTime());
  }

  getWorkday(site: string, date: Date): Workday | undefined {
    const tdate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 
      date.getDate()));
    if (this.useVariation(site, tdate)) {
      let start = new Date(this.startdate);
      while (start.getDay() !== 0) {
        start = new Date(start.getTime() - (24 * 3600000));
      }
      let days = Math.floor((tdate.getTime() - start.getTime()) / (24 * 3600000));
      let iDay = days % this.schedule.workdays.length;
      return this.schedule.getWorkday(iDay);
    }
    return undefined;
  }
}