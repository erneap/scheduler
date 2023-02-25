import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from '../home/not-found/not-found.component';
import { NewEmployeeComponent } from './new-employee/new-employee.component';
import { SiteEmployeeAssignmentComponent } from './site-employee-assignment/site-employee-assignment.component';
import { SiteEmployeeBasicComponent } from './site-employee-basic/site-employee-basic.component';
import { SiteEmployeeComponent } from './site-employee.component';
import { SitePtoHolidayComponent } from './site-pto-holiday/site-pto-holiday.component';

const routes: Routes = [
  {
    path: '', 
    component: SiteEmployeeComponent,
    children: [
      { path: '', redirectTo: '/siteemployees/ptoholidays', pathMatch: 'full'},
      { path: 'newemployee', component: NewEmployeeComponent },
      { path: 'profile', component: SiteEmployeeBasicComponent },
      { path: 'ptoholidays', component: SitePtoHolidayComponent },
      { path: 'assignments', component: SiteEmployeeAssignmentComponent },
      { path: '**', component: NotFoundComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SiteEmployeeRoutingModule { }
