import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { EmployeeHomeComponent } from "./employee-home/employee-home.component";
import { EmployeeScheduleComponent } from "./employee-schedule/employee-schedule.component";
import { LeaveRequestComponent } from "./leave-request/leave-request.component";
import { PtoHolidayComponent } from "./pto-holiday/pto-holiday.component";

const routes: Routes = [
  {
    path: '', 
    component: EmployeeHomeComponent,
    children: [
      { path: '', redirectTo: '/employee/schedule', pathMatch: 'full'},
      { path: 'schedule', component: EmployeeScheduleComponent },
      { path: 'ptoholidays', component: PtoHolidayComponent },
      { path: 'leaverequest', component: LeaveRequestComponent},
      { path: '**', component: EmployeeScheduleComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}