import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteEmployeeRoutingModule } from './site-employee-routing.module';
import { SiteEmployeeComponent } from './site-employee.component';
import { MaterialModule } from '../material.module';
import { GenericModule } from '../generic/generic.module';


@NgModule({
  declarations: [
    SiteEmployeeComponent
  ],
  imports: [
    CommonModule,
    SiteEmployeeRoutingModule,
    MaterialModule,
    GenericModule
  ]
})
export class SiteEmployeeModule { }
