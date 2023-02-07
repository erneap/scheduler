import { Component, Input } from '@angular/core';
import { Workday } from 'src/app/models/employees/assignments';

@Component({
  selector: 'app-employee-schedule-week',
  templateUrl: './employee-schedule-week.component.html',
  styleUrls: ['./employee-schedule-week.component.scss']
})
export class EmployeeScheduleWeekComponent {
  @Input() workdays: Workday[] = []; 
}
