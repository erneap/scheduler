import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteEmployeeComponent } from './site-employee.component';
import { MaterialModule } from '../material.module';
import { GenericModule } from '../generic/generic.module';
import { SitePtoHolidayComponent } from './site-pto-holiday/site-pto-holiday.component';
import { EmployeeModule } from '../employee/employee.module';
import { SiteEmployeeAssignmentComponent } from './site-employee-assignment/site-employee-assignment.component';
import { SiteEmployeeAssignmentScheduleComponent } from './site-employee-assignment/site-employee-assignment-schedule/site-employee-assignment-schedule.component';
import { SiteEmployeeAssignmentScheduleDayComponent } from './site-employee-assignment/site-employee-assignment-schedule-day/site-employee-assignment-schedule-day.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewEmployeeComponent } from './new-employee/new-employee.component';
import { SiteEmployeeEditorComponent } from './site-employee-editor/site-employee-editor.component';
import { SiteEmployeeCompanyInfoComponent } from './site-employee-company-info/site-employee-company-info.component';
import { SiteEmployeeLaborCodesComponent } from './site-employee-labor-codes/site-employee-labor-codes.component';
import { SiteEmployeeVariationComponent } from './site-employee-variation/site-employee-variation.component';
import { LeaveInformationComponent } from './leave-information/leave-information.component';
import { SiteEmployeeProfileComponent } from './site-employee-profile/site-employee-profile.component';

@NgModule({
  declarations: [
    SiteEmployeeComponent,
    SitePtoHolidayComponent,
    SiteEmployeeAssignmentComponent,
    SiteEmployeeAssignmentScheduleComponent,
    SiteEmployeeAssignmentScheduleDayComponent,
    NewEmployeeComponent,
    SiteEmployeeEditorComponent,
    SiteEmployeeCompanyInfoComponent,
    SiteEmployeeLaborCodesComponent,
    SiteEmployeeVariationComponent,
    LeaveInformationComponent,
    SiteEmployeeProfileComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    GenericModule,
    EmployeeModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SiteEmployeeModule { }
