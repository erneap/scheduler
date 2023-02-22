import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteRoutingModule } from './site-routing.module';
import { MaterialModule } from '../material.module';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    SiteRoutingModule,
    MaterialModule
  ]
})
export class SiteModule { }
