import { Employee, IEmployee } from "../employees/employee";
import { LeaveDay } from "../employees/leave";
import { Work } from "../employees/work";
import { ISite } from "../sites/site";
import { ITeam } from "../teams/team";
import { IUser, User } from "../users/user";

export interface NewSiteRequest {
  team: string;
  siteid: string;
  name: string;
  mids: boolean;
  offset: number;
  lead: IUser;
  scheduler?: IUser;
}

export interface CreateSiteEmployeeLeaveBalances {
  team: string;
  siteid: string;
  year: number;
}

export interface NewSiteWorkcenter {
  team: string;
  siteid: string;
  wkctrid: string;
  name: string;
}

export interface SiteWorkcenterUpdate {
  team: string;
  siteid: string;
  wkctrid: string;
  field: string;
  value: string;
}

export interface NewWorkcenterPosition {
  team: string;
  siteid: string;
  wkctrid: string;
  positionid: string;
  name: string;
}

export interface WorkcenterPositionUpdate {
  team: string;
  siteid: string;
  wkctrid: string;
  positionid: string;
  field: string;
  value: string;
}

export interface NewSiteLaborCode {
  team: string;
  siteid: string;
  reportid: number;
  chargeNumber: string;
  extension: string;
  clin?: string;
  slin?: string;
  location?: string;
  wbs?: string;
  minimumEmployees?: string;
  notAssignedName?: string;
  hoursPerEmployee?: string;
  exercise?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSiteLaborCode {
  team: string;
  siteid: string;
  reportid: number;
  chargeNumber: string;
  extension: string;
  field: string;
  value: string;
}

export interface CreateSiteForecast {
  team: string;
  siteid: string;
  name: string;
  startdate: Date;
  enddate: Date;
  period: number;
}

export interface UpdateSiteForecast {
  team: string;
  siteid: string;
  reportid: number;
  field: string;
  value: string;
}

export interface SiteResponse {
  team?: ITeam;
  site?: ISite;
  exception: string;
}

export interface IngestResponse {
  employees: IEmployee[];
  ingest: string;
  exception: string
}

export class IngestChange {
  employeeid: string;
  changetype: string;
  work?: Work;
  leave?: LeaveDay;

  constructor(empid: string, cType: string, work?: Work, leave?: LeaveDay) {
    this.employeeid = empid;
    this.changetype = cType;
    if (work) {
      this.work = new Work(work);
    }
    if (leave) {
      this.leave = new LeaveDay(leave);
    }
  }
}

export interface ManualIngestChanges {
  teamid: string;
  siteid: string;
  companyid: string;
  changes: IngestChange[];
}