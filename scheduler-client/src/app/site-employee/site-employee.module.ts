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
import { SiteEmployeeLeaveComponent } from './site-employee-leave/site-employee-leave.component';
import { SiteEmployeeLeaveRowComponent } from './site-employee-leave/site-employee-leave-row/site-employee-leave-row.component';
import { SiteEmployeeLeaveRequestComponent } from './site-employee-leave-request/site-employee-leave-request.component';
import { SiteEmployeeLeaveBalanceComponent } from './site-employee-leave-balance/site-employee-leave-balance.component';
import { SiteEmployeeLeaveBalanceYearComponent } from './site-employee-leave-balance/site-employee-leave-balance-year/site-employee-leave-balance-year.component';
import { UserAccountDialogComponent } from './site-employee-editor/user-account-dialog/user-account-dialog.component';
import { TeamModule } from '../team/team.module';
import { SiteEmployeeLeaveRequestsComponent } from './site-employee-leave-requests/site-employee-leave-requests.component';

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
    SiteEmployeeProfileComponent,
    SiteEmployeeLeaveComponent,
    SiteEmployeeLeaveRowComponent,
    SiteEmployeeLeaveRequestComponent,
    SiteEmployeeLeaveBalanceComponent,
    SiteEmployeeLeaveBalanceYearComponent,
    UserAccountDialogComponent,
    SiteEmployeeLeaveRequestsComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    GenericModule,
    EmployeeModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    SiteEmployeeComponent,
    NewEmployeeComponent,
    SiteEmployeeEditorComponent,
  ]
})
export class SiteEmployeeModule { }
