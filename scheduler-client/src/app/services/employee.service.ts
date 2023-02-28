import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Employee, IEmployee } from '../models/employees/employee';
import { ChangeAssignmentRequest, EmployeeLeaveRequest, EmployeeResponse, NewEmployeeAssignment, NewEmployeeRequest, UpdateRequest } from '../models/web/employeeWeb';
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

  addNewLeaveRequest(empid: string, start: Date, end: Date, 
    code: string): Observable<HttpResponse<EmployeeResponse>> {
    const data: EmployeeLeaveRequest = {
      employee: this.getEmployeeID(),
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
}
