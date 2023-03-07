import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteRoutingModule } from './site-routing.module';
import { MaterialModule } from '../material.module';
import { SiteWorkcentersComponent } from './site-workcenters/site-workcenters.component';
import { SiteComponent } from './site.component';
import { NewSiteComponent } from './new-site/new-site.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
  
    SiteWorkcentersComponent,
       SiteComponent,
       NewSiteComponent
  ],
  imports: [
    CommonModule,
    SiteRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SiteModule { }
