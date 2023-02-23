import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from '../home/not-found/not-found.component';
import { SiteEmployeeComponent } from './site-employee.component';
import { SitePtoHolidayComponent } from './site-pto-holiday/site-pto-holiday.component';

const routes: Routes = [
  {
    path: '', 
    component: SiteEmployeeComponent,
    children: [
      { path: '', redirectTo: '/siteemployees/ptoholidays', pathMatch: 'full'},
      { path: 'ptoholidays', component: SitePtoHolidayComponent },
      { path: '**', component: NotFoundComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SiteEmployeeRoutingModule { }
