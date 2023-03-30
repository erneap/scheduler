import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { SiteWorkcentersComponent } from './site-workcenters/site-workcenters.component';
import { SiteComponent } from './site.component';
import { NewSiteComponent } from './new-site/new-site.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SiteBasicInformationComponent } from './site-basic-information/site-basic-information.component';
import { SiteForecastReportEditorComponent } from './site-forecast-report-editor/site-forecast-report-editor.component';
import { SiteWorkcenterShiftComponent } from './site-workcenters/site-workcenter-shift/site-workcenter-shift.component';
import { SiteWorkcenterPositionComponent } from './site-workcenters/site-workcenter-position/site-workcenter-position.component';
import { SiteForecastReportPeriodsComponent } from './site-forecast-report-editor/site-forecast-report-periods/site-forecast-report-periods.component';


@NgModule({
  declarations: [
  
    SiteWorkcentersComponent,
       SiteComponent,
       NewSiteComponent,
       SiteBasicInformationComponent,
       SiteForecastReportEditorComponent,
       SiteWorkcenterShiftComponent,
       SiteWorkcenterPositionComponent,
       SiteForecastReportPeriodsComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SiteModule { }
