import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeScheduleComponent } from './employee-schedule/employee-schedule.component';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeScheduleDayComponent } from './employee-schedule/employee-schedule-day/employee-schedule-day.component';
import { EmployeeScheduleMonthComponent } from './employee-schedule/employee-schedule-month/employee-schedule-month.component';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeHomeComponent } from './employee-home/employee-home.component';
import { PtoHolidayComponent } from './pto-holiday/pto-holiday.component';
import { HolidayComponent } from './pto-holiday/holiday/holiday.component';
import { HolidayCellComponent } from './pto-holiday/holiday/holiday-cell/holiday-cell.component';
import { HolidayCellDisplayComponent } from './pto-holiday/holiday/holiday-cell/holiday-cell-display/holiday-cell-display.component';
import { PtoComponent } from './pto-holiday/pto/pto.component';
import { PtoMonthComponent } from './pto-holiday/pto/pto-month/pto-month.component';
import { PtoMonthDatesDisplayComponent } from './pto-holiday/pto/pto-month/pto-month-dates-display/pto-month-dates-display.component';
import { LeaveRequestComponent } from './leave-request/leave-request.component';
import { LeaveRequestCalendarComponent } from './leave-request/leave-request-calendar/leave-request-calendar.component';
import { LeaveRequestCalendarDayComponent } from './leave-request/leave-request-calendar-day/leave-request-calendar-day.component';
import { DeleteLeaveRequestDialogComponent } from './leave-request/delete-leave-request-dialog/delete-leave-request-dialog.component';
import { PtoHolidayChartComponent } from './pto-holiday/pto-holiday-chart/pto-holiday-chart.component';
import { EmployeeProfileComponent } from './employee-profile/employee-profile.component';
import { EmployeeProfileFormComponent } from './employee-profile/employee-profile-form/employee-profile-form.component';

@NgModule({
  declarations: [
    EmployeeScheduleComponent,
    EmployeeScheduleDayComponent,
    EmployeeScheduleMonthComponent,
    EmployeeHomeComponent,
    PtoHolidayComponent,
    HolidayComponent,
    HolidayCellComponent,
    HolidayCellDisplayComponent,
    PtoComponent,
    PtoMonthComponent,
    PtoMonthDatesDisplayComponent,
    LeaveRequestComponent,
    LeaveRequestCalendarComponent,
    LeaveRequestCalendarDayComponent,
    DeleteLeaveRequestDialogComponent,
    PtoHolidayChartComponent,
    EmployeeProfileComponent,
    EmployeeProfileFormComponent
  ],
  imports: [
    CommonModule,
    EmployeeRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    PtoHolidayChartComponent,
    EmployeeProfileFormComponent
  ]
})
export class EmployeeModule { }
