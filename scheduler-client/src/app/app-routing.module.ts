import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './home/not-found/not-found.component';
import { NewEmployeeComponent } from './site-employee/new-employee/new-employee.component';
import { SiteEmployeeComponent } from './site-employee/site-employee.component';
import { NewSiteComponent } from './site/new-site/new-site.component';
import { SiteComponent } from './site/site.component';

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
  { path: 'siteemployees', component: SiteEmployeeComponent},
  { path: 'newsite', component: NewSiteComponent },
  { path: 'siteeditor', component: SiteComponent},
  { path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
