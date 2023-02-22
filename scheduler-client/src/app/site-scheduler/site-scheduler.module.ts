import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteSchedulerRoutingModule } from './site-scheduler-routing.module';
import { SiteSchedulerComponent } from './site-scheduler.component';
import { SiteScheduleDayComponent } from './site-schedule/site-schedule-day/site-schedule-day.component';
import { SiteScheduleRowComponent } from './site-schedule/site-schedule-row/site-schedule-row.component';
import { SiteScheduleMonthComponent } from './site-schedule/site-schedule-month/site-schedule-month.component';
import { MaterialModule } from '../material.module';
import { SiteScheduleComponent } from './site-schedule/site-schedule.component';
import { SiteAvailabilityComponent } from './site-availability/site-availability.component';
import { SiteAvailabilityMonthComponent } from './site-availability/site-availability-month/site-availability-month.component';
import { SiteAvailabilityShiftComponent } from './site-availability/site-availability-shift/site-availability-shift.component';
import { SiteAvailabilityDayComponent } from './site-availability/site-availability-day/site-availability-day.component';


@NgModule({
  declarations: [
    SiteSchedulerComponent,
    SiteScheduleComponent,
    SiteScheduleDayComponent,
    SiteScheduleRowComponent,
    SiteScheduleMonthComponent,
    SiteAvailabilityComponent,
    SiteAvailabilityMonthComponent,
    SiteAvailabilityShiftComponent,
    SiteAvailabilityDayComponent
  ],
  imports: [
    CommonModule,
    SiteSchedulerRoutingModule,
    MaterialModule
  ]
})
export class SiteSchedulerModule { }
