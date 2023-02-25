import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteEmployeeRoutingModule } from './site-employee-routing.module';
import { SiteEmployeeComponent } from './site-employee.component';
import { MaterialModule } from '../material.module';
import { GenericModule } from '../generic/generic.module';
import { SitePtoHolidayComponent } from './site-pto-holiday/site-pto-holiday.component';
import { EmployeeModule } from '../employee/employee.module';
import { SiteEmployeeBasicComponent } from './site-employee-basic/site-employee-basic.component';
import { SiteEmployeeAssignmentComponent } from './site-employee-assignment/site-employee-assignment.component';
import { SiteEmployeeAssignmentScheduleComponent } from './site-employee-assignment/site-employee-assignment-schedule/site-employee-assignment-schedule.component';
import { SiteEmployeeAssignmentScheduleDayComponent } from './site-employee-assignment/site-employee-assignment-schedule-day/site-employee-assignment-schedule-day.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewEmployeeComponent } from './new-employee/new-employee.component';


@NgModule({
  declarations: [
    SiteEmployeeComponent,
    SitePtoHolidayComponent,
    SiteEmployeeBasicComponent,
    SiteEmployeeAssignmentComponent,
    SiteEmployeeAssignmentScheduleComponent,
    SiteEmployeeAssignmentScheduleDayComponent,
    NewEmployeeComponent
  ],
  imports: [
    CommonModule,
    SiteEmployeeRoutingModule,
    MaterialModule,
    GenericModule,
    EmployeeModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SiteEmployeeModule { }
