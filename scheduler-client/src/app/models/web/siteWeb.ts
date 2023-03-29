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