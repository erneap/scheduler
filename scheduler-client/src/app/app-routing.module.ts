import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './home/not-found/not-found.component';
import { EmployeeHomeComponent } from './employee/employee-home/employee-home.component';

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
  { path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
