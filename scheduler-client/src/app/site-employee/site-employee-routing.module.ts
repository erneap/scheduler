import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from '../home/not-found/not-found.component';
import { SiteEmployeeComponent } from './site-employee.component';

const routes: Routes = [
  {
    path: '', 
    component: SiteEmployeeComponent,
    children: [
      { path: '**', component: NotFoundComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SiteEmployeeRoutingModule { }
