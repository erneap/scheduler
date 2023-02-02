import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeScheduleComponent } from './employee-schedule/employee-schedule.component';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeScheduleDayComponent } from './employee-schedule/employee-schedule-day/employee-schedule-day.component';
import { EmployeeScheduleWeekComponent } from './employee-schedule/employee-schedule-week/employee-schedule-week.component';
import { EmployeeScheduleMonthComponent } from './employee-schedule/employee-schedule-month/employee-schedule-month.component';



@NgModule({
  declarations: [
    EmployeeScheduleComponent,
    EmployeeScheduleDayComponent,
    EmployeeScheduleWeekComponent,
    EmployeeScheduleMonthComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EmployeeModule { }
