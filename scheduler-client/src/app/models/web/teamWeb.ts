export interface CreateTeamRequest {
  name: string;
}

export interface UpdateTeamRequest {
  teamid: string;
  additionalid: string;
  holiday?: string;
  field: string;
  value: string;
}

export interface CreateTeamWorkcodeRequest {
  teamid: string;
  id: string;
  title: string;
  start: number;
  shiftCode: number;
  isLeave: boolean;
  textcolor: string;
  backcolor: string;
}

export interface CreateTeamCompany {
  teamid: string;
  id: string;
  name: string;
  ingest: string;
}

export interface CreateCompanyHoliday {
  teamid: string;
  companyid: string;
  holidayid: string;
  name: string;
  actual?: string;
}