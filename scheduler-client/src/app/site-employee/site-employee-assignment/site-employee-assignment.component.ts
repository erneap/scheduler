import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Assignment, Schedule } from 'src/app/models/employees/assignments';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { Workcenter } from 'src/app/models/sites/workcenter';
import { ChangeAssignmentRequest, EmployeeResponse } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteService } from 'src/app/services/site.service';

@Component({
  selector: 'app-site-employee-assignment',
  templateUrl: './site-employee-assignment.component.html',
  styleUrls: ['./site-employee-assignment.component.scss']
})
export class SiteEmployeeAssignmentComponent {
  private _employee: Employee = new Employee();
  @Input()
  public set employee(iEmp: IEmployee) {
    this._employee = new Employee(iEmp);
    this.setAssignments();
  }
  get employee(): Employee {
    return this._employee;
  }
  siteID: string = '';
  assignment: Assignment = new Assignment();
  schedule: Schedule = new Schedule();
  assignmentList: Assignment[] = [];
  workcenters: Workcenter[] = [];
  asgmtForm: FormGroup;
  showSchedule: boolean = false;
  rotatePeriods: string[] = new Array("28", "56", "84", "112", "140", "168", "336");

  constructor(
    protected siteService: SiteService,
    protected empService: EmployeeService,
    protected authService: AuthService,
    protected dialogService: DialogService,
    private fb: FormBuilder
  ) {
    const site = this.siteService.getSite();
    if (site) {
      this.siteID = site.id;
      this.workcenters = [];
      if (site.workcenters && site.workcenters.length > 0) {
        site.workcenters.forEach(wc => {
          this.workcenters.push(new Workcenter(wc));
        });
      }
    }
    this.asgmtForm = this.fb.group({
      assignment: '0',
      workcenter: '',
      startdate: new Date(),
      enddate: new Date(9999, 11, 30),
      schedule: '0',
      rotationdate: new Date(),
      rotationdays: 0,
    });
    this.setAssignments();
  }

  setAssignments() {
    this.assignmentList = [];
    this.showSchedule = false;
    this.assignment = new Assignment();
    this.employee.data.assignments.forEach(asgmt => {
      if (asgmt.site.toLowerCase() === this.siteID.toLowerCase()) {
        this.assignmentList.push(new Assignment(asgmt));
      }
    });
    this.assignmentList.sort((a,b) => b.compareTo(a));
    if (this.assignmentList.length > 0) {
      this.assignment = this.assignmentList[0];
    }
    this.setAssignment();
  }

  setAssignment() {
    this.showSchedule = (this.assignment.schedules.length > 0);
    if (this.assignment.schedules.length > 0) {
      this.schedule = this.assignment.schedules[0];
    } 
    this.asgmtForm.controls["assignment"].setValue(this.asgmtID(this.assignment));
    this.asgmtForm.controls["workcenter"].setValue(this.assignment.workcenter);
    this.asgmtForm.controls["startdate"].setValue(
      new Date(this.assignment.startDate));
    this.asgmtForm.controls["enddate"].setValue(
      new Date(this.assignment.endDate));
    if (this.schedule) {
      this.asgmtForm.controls["schedule"].setValue(this.schedID(this.schedule));
    } else {
      this.asgmtForm.controls["schedule"].setValue('');
    }
    this.asgmtForm.controls["rotationdate"].setValue(
      new Date(this.assignment.rotationdate));
    this.asgmtForm.controls["rotationdays"].setValue(
      `${this.assignment.rotationdays}`);
  }
  
  selectAssignment() {
    const id = Number(this.asgmtForm.value.assignment);
    this.assignment = new Assignment();
    this.employee.data.assignments.forEach(asgmt => {
      if (asgmt.id === id) {
        this.assignment = new Assignment(asgmt);
      }
    });
    this.setAssignment();
  }

  getDateString(date: Date) {
    if (date.getFullYear() !== 9999) {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    return '';
  }

  getYearFirstDate(date: Date): string {
    let answer =  `${date.getFullYear()}-`;
    if (date.getMonth() + 1 < 10) {
      answer += '0';
    }
    answer += `${date.getMonth() + 1}-`;
    if (date.getDate() < 10) {
      answer += '0';
    }
    answer += `${date.getDate()}`;
    return answer;
  }

  asgmtID(asgmt: Assignment): string {
    return `${asgmt.id}`;
  }

  schedID(sch: Schedule): string {
    return `${sch.id}`;
  }

  updateField(field: string) {
    let asgmtid = Number(this.asgmtForm.value.assignment);
    if (asgmtid > 0) {
      var value: any;
      switch (field.toLowerCase()) {
        case "workcenter":
          value = this.asgmtForm.value.workcenter;
          break;
        case "startdate":
          value = this.getYearFirstDate(this.asgmtForm.value.startdate);
          break;
        case "enddate":
          value = this.getYearFirstDate(this.asgmtForm.value.enddate);
          break;
        case "addschedule":
          value = 7;
          break;
        case "rotationdate":
          value = this.getYearFirstDate(this.asgmtForm.value.rotationdate);
          break;
        case "rotationdays":
          value = this.asgmtForm.value.rotationdays;
          break;
      }
      this.dialogService.showSpinner();
      this.authService.statusMessage = `Updating Employee Assignment -`
        + `${field.toUpperCase()}`;
      this.empService.updateAssignment(this.employee.id, asgmtid, field, value)
        .subscribe({
          next: resp => {
            this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: EmployeeResponse | null = resp.body;
            if (data && data !== null) {
              if (data.employee) {
                this.employee = new Employee(data.employee);
                this.employee.data.assignments.forEach(agmt => {
                  if (agmt.id === this.assignment.id) {
                    this.assignment = new Assignment(agmt);
                    this.setAssignment();
                    if (field.toLowerCase() === "addschedule") {
                      this.assignment.schedules.sort((a,b) => a.compareTo(b));
                      this.schedule = this.assignment.schedules[
                        this.assignment.schedules.length - 1];
                    }
                  }
                });
              }
              const emp = this.empService.getEmployee();
              if (data.employee && emp && emp.id === data.employee.id) {
                this.empService.setEmployee(data.employee);
              }
              const site = this.siteService.getSite();
              if (site && site.employees && site.employees.length && data.employee) {
                let found = false;
                for (let i=0; i < site.employees.length && !found; i++) {
                  if (site.employees[i].id === data.employee.id) {
                    site.employees[i] = new Employee(data.employee);
                    found = true;
                  }
                }
                if (!found) {
                  site.employees.push(new Employee(data.employee));
                }
                site.employees.sort((a,b) => a.compareTo(b));
                this.siteService.setSite(site);
                this.siteService.setSelectedEmployee(data.employee);
              }
              if (field.toLowerCase() === "addschedule") {

              }
            }
            this.authService.statusMessage = "Update complete";
          },
          error: err => {
            this.dialogService.closeSpinner();
            this.authService.statusMessage = err.error.exception;
          }
        })
    }
  }

  updateSchedule(data: string) {
    if (typeof(data) === 'string') {
      const chgParts = data.split("|");
      const change: ChangeAssignmentRequest = {
        employee: this.employee.id,
        asgmt: this.assignment.id,
        schedule: Number(chgParts[1]),
        field: chgParts[3],
        value: chgParts[4],
      }
      if (chgParts[0].toLowerCase() === 'schedule') {
        if (change.field.toLowerCase() === 'removeschedule') {

        } else {
          this.dialogService.showSpinner();
          this.authService.statusMessage = `Updating Employee Assignment -`
            + `Schedule Days`;
          this.empService.updateAssignmentSchedule(change)
            .subscribe({
              next: resp => {
                this.dialogService.closeSpinner();
                if (resp.headers.get('token') !== null) {
                  this.authService.setToken(resp.headers.get('token') as string);
                }
                const data: EmployeeResponse | null = resp.body;
                if (data && data !== null) {
                  if (data.employee) {
                    this.employee = new Employee(data.employee);
                    this.employee.data.assignments.forEach(agmt => {
                      if (agmt.id === this.assignment.id) {
                        this.assignment = new Assignment(agmt);
                        this.setAssignment();
                        this.assignment.schedules.forEach(sch => {
                          if (sch.id === this.schedule.id) {
                            this.schedule = new Schedule(sch);
                          }
                        });
                      }
                    });
                  }
                  const emp = this.empService.getEmployee();
                  if (data.employee && emp && emp.id === data.employee.id) {
                    this.empService.setEmployee(data.employee);
                  }
                  const site = this.siteService.getSite();
                  if (site && site.employees && site.employees.length && data.employee) {
                    let found = false;
                    for (let i=0; i < site.employees.length && !found; i++) {
                      if (site.employees[i].id === data.employee.id) {
                        site.employees[i] = new Employee(data.employee);
                        found = true;
                      }
                    }
                    if (!found) {
                      site.employees.push(new Employee(data.employee));
                    }
                    site.employees.sort((a,b) => a.compareTo(b));
                    this.siteService.setSite(site);
                    this.siteService.setSelectedEmployee(data.employee);
                  }
                }
                this.authService.statusMessage = "Update complete";
              },
              error: err => {
                this.dialogService.closeSpinner();
                this.authService.statusMessage = err.error.exception;
              }
            });
        }
      } else {
        change.workday = Number(chgParts[2]);
        this.dialogService.showSpinner();
        this.authService.statusMessage = `Updating Employee Assignment -`
          + `Schedule Days`;
        this.empService.updateAssignmentWorkday(change)
          .subscribe({
            next: resp => {
              this.dialogService.closeSpinner();
              if (resp.headers.get('token') !== null) {
                this.authService.setToken(resp.headers.get('token') as string);
              }
              const data: EmployeeResponse | null = resp.body;
              if (data && data !== null) {
                if (data.employee) {
                  this.employee = new Employee(data.employee);
                  this.employee.data.assignments.forEach(agmt => {
                    if (agmt.id === this.assignment.id) {
                      this.assignment = new Assignment(agmt);
                      this.setAssignment();
                      this.assignment.schedules.forEach(sch => {
                        if (sch.id === this.schedule.id) {
                          this.schedule = new Schedule(sch);
                        }
                      });
                    }
                  });
                }
                const emp = this.empService.getEmployee();
                if (data.employee && emp && emp.id === data.employee.id) {
                  this.empService.setEmployee(data.employee);
                }
                const site = this.siteService.getSite();
                if (site && site.employees && site.employees.length && data.employee) {
                  let found = false;
                  for (let i=0; i < site.employees.length && !found; i++) {
                    if (site.employees[i].id === data.employee.id) {
                      site.employees[i] = new Employee(data.employee);
                      found = true;
                    }
                  }
                  if (!found) {
                    site.employees.push(new Employee(data.employee));
                  }
                  site.employees.sort((a,b) => a.compareTo(b));
                  this.siteService.setSite(site);
                  this.siteService.setSelectedEmployee(data.employee);
                }
              }
              this.authService.statusMessage = "Update complete";
            },
            error: err => {
              this.dialogService.closeSpinner();
              this.authService.statusMessage = err.error.exception;
            }
          });
      }
    }
  }
}
