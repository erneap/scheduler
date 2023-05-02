import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Variation } from '../models/employees/assignments';
import { Employee, IEmployee } from '../models/employees/employee';
import { LeaveDay } from '../models/employees/leave';
import { ChangeAssignmentRequest, EmployeeLaborCodeRequest, 
  EmployeeLeaveDayRequest, EmployeeLeaveRequest, EmployeeResponse, 
  NewEmployeeAssignment, NewEmployeeRequest, NewEmployeeVariation, 
  UpdateRequest, LeaveBalanceRequest, CreateUserAccount, Message } from '../models/web/employeeWeb';
import { CreateSiteEmployeeLeaveBalances, SiteResponse } from '../models/web/siteWeb';
import { CacheService } from './cache.service';
import { TeamService } from './team.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends CacheService {
  showHolidays: boolean = true;

  constructor(
    protected teamService: TeamService,
    private httpClient: HttpClient
  ) 
  { 
    super();
  }

  getEmployee(): Employee | undefined {
    const iEmp = this.getItem<IEmployee>("current-employee");
    if (iEmp) {
      const emp = new Employee(iEmp);
      // find the employee's company and see if they provide holidays.
      const team = this.teamService.getTeam();
      if (team) {
        team.companies.forEach(co => {
          if (emp.data.companyinfo.company.toLowerCase() === co.id.toLowerCase()) {
            this.showHolidays = (co.holidays.length > 0);
          }
        })
      }
      return emp;
    }
    return undefined;
  }

  setEmployee(iEmp: IEmployee): void {
    const emp = new Employee(iEmp);
    // find the employee's company and see if they provide holidays.
    const team = this.teamService.getTeam();
    if (team) {
      team.companies.forEach(co => {
        if (emp.data.companyinfo.company.toLowerCase() === co.id.toLowerCase()) {
          this.showHolidays = (co.holidays.length > 0);
        }
      })
    }
    this.setItem('current-employee', emp);
  }

  getEmployeeID(): string {
    const emp = this.getEmployee();
    if (emp) {
      return emp.id;
    }
    return '';
  }

  updateEmployee(empID: string, field: string, value: string): Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee';
    const data: UpdateRequest = {
      id: empID,
      field: field,
      value: value,
    };
    return this.httpClient.put<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  deleteEmployee(empID: string): Observable<HttpResponse<Message>> {
    const url = `/scheduler/api/v1/employee/${empID}`;
    return this.httpClient.delete<Message>(url, {observe: 'response'});
  }

  addUserAccount(empID: string, email: string, password: string): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/account';
    const data: CreateUserAccount = {
      id: empID,
      emailAddress: email,
      firstName: '',
      middleName: '',
      lastName: '',
      password: password,
    }
    return this.httpClient.post<EmployeeResponse>(url, data, {observe: 'response'});
  }

  addNewLeaveRequest(empid: string, start: Date, end: Date, 
    code: string): Observable<HttpResponse<EmployeeResponse>> {
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(),
      start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), 
      end.getDate()));
    const data: EmployeeLeaveRequest = {
      employee: empid,
      code: code,
      startdate: start,
      enddate: end,
    };
    const url = '/scheduler/api/v1/employee/request';
    return this.httpClient.post<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  updateLeaveRequest(empid: string, reqid: string, field: string, value: string): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/request';
    const data: UpdateRequest = {
      id: empid,
      optional: reqid,
      field: field,
      value: value,
    }
    return this.httpClient.put<EmployeeResponse>(url, data, 
      {observe: 'response'})
  }

  deleteLeaveRequest(empid: string, reqid: string): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = `/scheduler/api/v1/employee/request/${empid}/${reqid}`;
    return this.httpClient.delete<EmployeeResponse>(url, { observe: 'response'});
  }

  addEmployee(employee: Employee, passwd: string, teamid: string, siteid: string): 
  Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee';
    const empRequest: NewEmployeeRequest = {
      employee: employee,
      password: passwd,
      team: teamid,
      site: siteid,
    }
    return this.httpClient.post<EmployeeResponse>(url, empRequest, 
      { observe: 'response'});
  }

  AddAssignment(empID: string, siteID: string, wkctr: string, start: Date, 
    days: number): Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/assignment';
    const data: NewEmployeeAssignment = {
      employee: empID,
      site: siteID,
      workcenter: wkctr,
      start: start,
      scheduledays: days,
    };
    return this.httpClient.post<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  updateAssignment(empID: string, asgmt: number, field: string, value: any,
    schedID?: number): Observable<HttpResponse<EmployeeResponse>>  {
      const url = '/scheduler/api/v1/employee/assignment';
      const data: ChangeAssignmentRequest = {
        employee: empID,
        asgmt: asgmt,
        field: field,
        value: value,
      };
      if (schedID) {
        data.schedule = schedID;
      }
      return this.httpClient.put<EmployeeResponse>(url, data, 
        { observe: 'response'});
  }

  updateAssignmentSchedule(data: ChangeAssignmentRequest): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/assignment';
    return this.httpClient.put<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  updateAssignmentWorkday(data: ChangeAssignmentRequest): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/assignment/workday';
    return this.httpClient.put<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  deleteAssignment(empID: string, asgmtID: number):
    Observable<HttpResponse<EmployeeResponse>> {
    const url = `/scheduler/api/v1/employee/assignment/${empID}/${asgmtID}`;
    return this.httpClient.delete<EmployeeResponse>(url, { observe: 'response'});
  }

  addLaborCode(empID: string, chgNo: string, ext: string):
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/laborcode';
    const data: EmployeeLaborCodeRequest = {
      employee: empID,
      chargeNumber: chgNo,
      extension: ext,
    };
    return this.httpClient.post<EmployeeResponse>(url, data, 
      {observe: 'response'});
  }

  removeLaborCode(empID: string, chgNo: string, ext: string):
    Observable<HttpResponse<EmployeeResponse>> {
    const url = `/scheduler/api/v1/employee/laborcode/${empID}/${chgNo}/${ext}`;
    return this.httpClient.delete<EmployeeResponse>(url, { observe: 'response'});
  }

  addVariation(empID: string, vari: Variation): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/variation';
    const data: NewEmployeeVariation = {
      employee: empID,
      variation: vari,
    }
    return this.httpClient.post<EmployeeResponse>(url, data, { observe: 'response'});
  }

  updateVariation(data: ChangeAssignmentRequest, isWorkday: boolean):
    Observable<HttpResponse<EmployeeResponse>> {
    let url = '/scheduler/api/v1/employee/variation';
    if (isWorkday) {
      url += '/workday';
    }
    return this.httpClient.put<EmployeeResponse>(url, data, { observe: 'response'});
  }

  deleteVariation(empID: string, variationID: number): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = `/scheduler/api/v1/employee/variation/${empID}/${variationID}`;
    return this.httpClient.delete<EmployeeResponse>(url, {observe: 'response'});
  }

  addLeave(empID: string, leave: LeaveDay): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/leaves';
    const data: EmployeeLeaveDayRequest = {
      employee: empID,
      leave: leave,
    };
    return this.httpClient.post<EmployeeResponse>(url, data, 
      { observe: 'response'});
  }

  updateLeave(empID: string, id: number, field: string, value: string): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/leaves';
    const data: UpdateRequest = {
      id: empID,
      optional: `${id}`,
      field: field,
      value: value,
    };
    return this.httpClient.put<EmployeeResponse>(url, data,
      {observe: 'response'});
  }

  deleteLeave(empID: string, id: number): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = `/scheduler/api/v1/employee/leaves/${empID}/${id}`;
    return this.httpClient.delete<EmployeeResponse>(url, {observe: 'response'});
  }

  createLeaveBalance(empID: string, year: number): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/balance';
    const data: LeaveBalanceRequest = {
      employee: empID,
      year: year,
      annual: 0.0,
      carryover: 0.0
    };
    return this.httpClient.post<EmployeeResponse>(url, data, 
      {observe: 'response'});
  }

  updateLeaveBalance(empID: string, year: number, field: string, value: string): 
    Observable<HttpResponse<EmployeeResponse>> {
    const url = '/scheduler/api/v1/employee/balance';
    const data: UpdateRequest = {
      id: empID,
      optional: `${year}`,
      field: field,
      value: value
    };
    return this.httpClient.put<EmployeeResponse>(url, data, 
      {observe: 'response'});
  }

  createAllLeaveBalances(teamID: string, siteID: string, year: number): 
  Observable<HttpResponse<SiteResponse>> {
    const url = '/scheduler/api/v1/site/balances';
    const data: CreateSiteEmployeeLeaveBalances = {
      team: teamID,
      siteid: siteID,
      year: year
    };
    return this.httpClient.post<SiteResponse>(url, data, { observe: 'response'});
  }
}
