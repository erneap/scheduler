import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteEmployeeRoutingModule } from './site-employee-routing.module';
import { SiteEmployeeComponent } from './site-employee.component';
import { MaterialModule } from '../material.module';
import { GenericModule } from '../generic/generic.module';
import { SitePtoHolidayComponent } from './site-pto-holiday/site-pto-holiday.component';
import { EmployeeModule } from '../employee/employee.module';
import { SiteEmployeeBasicComponent } from './site-employee-basic/site-employee-basic.component';


@NgModule({
  declarations: [
    SiteEmployeeComponent,
    SitePtoHolidayComponent,
    SiteEmployeeBasicComponent
  ],
  imports: [
    CommonModule,
    SiteEmployeeRoutingModule,
    MaterialModule,
    GenericModule,
    EmployeeModule
  ]
})
export class SiteEmployeeModule { }
