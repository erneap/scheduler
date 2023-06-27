import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './home/not-found/not-found.component';
import { NewEmployeeComponent } from './site-employee/new-employee/new-employee.component';
import { SiteEmployeeComponent } from './site-employee/site-employee.component';
import { NewSiteComponent } from './site/new-site/new-site.component';
import { SiteComponent } from './site/site.component';
import { TeamSiteEditorComponent } from './team/team-site-editor/team-site-editor.component';
import { SiteEmployeeLeaveRequestApproverComponent } from './site-employee/site-employee-leave-request-approver/site-employee-leave-request-approver.component';
import { FileIngestComponent } from './site-ingest/file-ingest/file-ingest.component';
import { TeamListEditorComponent } from './admin-actions/team-list-editor/team-list-editor.component';
import { TeamComponent } from './team/team.component';
import { DataPurgeComponent } from './admin-actions/data-purge/data-purge.component';
import { ReportsComponent } from './reports/reports.component';
import { NotificationsComponent } from './employee/notifications/notifications.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'employee', 
    loadChildren: () => import('./employee/employee.module')
      .then(m => m.EmployeeModule) 
  },
  { path: 'siteschedule',
    loadChildren: () => import('./site-scheduler/site-scheduler.module')
      .then(m => m.SiteSchedulerModule)
  },
  { path: 'newemployee', component: NewEmployeeComponent },
  { path: 'siteemployees', component: SiteEmployeeComponent },
  { path: 'siteleaveapprover', component: SiteEmployeeLeaveRequestApproverComponent },
  { path: 'newsite', component: NewSiteComponent },
  { path: 'siteeditor', component: SiteComponent},
  { path: 'ingest/files', component: FileIngestComponent },
  { path: 'team/siteeditor', component: TeamSiteEditorComponent},
  { path: 'team/editor', component: TeamComponent },
  { path: 'admin/teams', component: TeamListEditorComponent },
  { path: 'admin/purge', component: DataPurgeComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
