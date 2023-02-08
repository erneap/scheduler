import { Component, Input } from '@angular/core';
import { ILeaveDay, LeaveDay } from 'src/app/models/employees/leave';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-pto-month-dates-display',
  templateUrl: './pto-month-dates-display.component.html',
  styleUrls: ['./pto-month-dates-display.component.scss']
})
export class PtoMonthDatesDisplayComponent {
  private _leaves: LeaveDay[] = [];
  @Input()
  public set leaves(lvs: ILeaveDay[]) {
    this._leaves = [];
    lvs.forEach(lv => {
      this._leaves.push(new LeaveDay(lv));
    });
    this._leaves.sort((a,b) => a.compareTo(b));
  }
  get leaves(): LeaveDay[] {
    return this._leaves;
  }
  displayStyle: string = 'color: black;'

  constructor(
    protected teamService: TeamService
  ) { }

  setDisplayStyle() {
    
  }
}
