import { IEmployee } from "../employees/employee";
import { ISite } from "../sites/site";
import { ITeam } from "../teams/team";
import { IUser } from "../users/user";

export interface AuthenticationRequest {
  emailAddress: string;
  password: string;
}

export interface UpdateRequest {
  id: string;
  optional?: string;
  field: string;
  value: string;
}

export interface ChangePasswordRequest {
  id: string;
  password: string;
}

export interface Message {
  message: string
}

export interface NewEmployeeRequest {
  team: string;
  site: string;
  employee: IEmployee;
  password: string;
}

export interface NewEmployeeAssignment {
  employee: string;
  site: string;
  workcenter: string;
  start: Date;
  scheduledays: number;
}

export interface ChangeAssignmentRequest {
  employee: string;
  asgmt: number;
  schedule?: number;
  workday?: number;
  field: string;
  value: any;
}

export interface NewEmployeeVariation {
  employee: string;
  site: string;
  mids: boolean;
  start: Date;
  end: Date;
  workcenter: string;
  code: string;
  hours: number;
  daysoff: string;
}

export interface LeaveBalanceRequest {
  employee: string;
  year: number;
  annual?: number;
  carryover?: number;
}

export interface EmployeeLeaveRequest {
  employee: string;
  code: string;
  startdate: Date;
  enddate: Date;
}

export interface EmployeeLaborCodeRequest {
  employee: string;
  chargeNumber: string;
  extension: string;
}

export interface AuthenticationResponse {
  user?: IUser;
  token: string;
  employee?: IEmployee;
  site?: ISite;
  team?: ITeam;
  exception: string;
}

export interface EmployeeResponse {
  employee?: IEmployee;
  exception: string;
}

export interface Message {
  message: string;
}