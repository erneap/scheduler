import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Assignment, Schedule } from 'src/app/models/employees/assignments';
import { Employee, IEmployee } from 'src/app/models/employees/employee';
import { Workcenter } from 'src/app/models/sites/workcenter';
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
      if (asgmt.site === this.siteID) {
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
    this.showSchedule = (this.assignment.id > 0);
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

  asgmtID(asgmt: Assignment): string {
    return `${asgmt.id}`;
  }

  schedID(sch: Schedule): string {
    return `${sch.id}`;
  }

}
