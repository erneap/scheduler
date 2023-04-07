import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamSiteEmployeeEditorComponent } from './team-site-employee-editor/team-site-employee-editor.component';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TeamSiteEditorComponent } from './team-site-editor/team-site-editor.component';
import { SiteModule } from '../site/site.module';
import { SiteEmployeeModule } from '../site-employee/site-employee.module';
import { TeamCompanyComponent } from './team-company/team-company.component';
import { TeamCompanyHolidaysComponent } from './team-company/team-company-holidays/team-company-holidays.component';
import { TeamWorkcodesComponent } from './team-workcodes/team-workcodes.component';
import { EditorComponent } from './editor/editor.component';

@NgModule({
  declarations: [
    TeamSiteEmployeeEditorComponent,
    TeamSiteEditorComponent,
    TeamCompanyComponent,
    TeamCompanyHolidaysComponent,
    TeamWorkcodesComponent,
    EditorComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SiteModule,
    SiteEmployeeModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class TeamModule { }
