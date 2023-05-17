import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsComponent } from './reports.component';
import { MaterialModule } from '../material.module';
import { GenericModule } from '../generic/generic.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReportScheduleComponent } from './report-schedule/report-schedule.component';
import { ReportLeaveListComponent } from './report-leave-list/report-leave-list.component';



@NgModule({
  declarations: [
    ReportsComponent,
    ReportScheduleComponent,
    ReportLeaveListComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    GenericModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ReportsModule { }
