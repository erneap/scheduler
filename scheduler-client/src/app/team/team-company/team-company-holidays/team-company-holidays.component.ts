import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { Company, CompanyHoliday, ICompany } from 'src/app/models/teams/company';
import { ITeam, Team } from 'src/app/models/teams/team';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-team-company-holidays',
  templateUrl: './team-company-holidays.component.html',
  styleUrls: ['./team-company-holidays.component.scss']
})
export class TeamCompanyHolidaysComponent {
  private _team: Team = new Team();
  private _company?: Company = new Company();
  @Input()
  public set team(iTeam: ITeam) {
    this._team = new Team(iTeam);
  }
  get team(): Team {
    return this._team;
  }
  @Input()
  public set company(iCompany: ICompany | undefined) {
    if (iCompany) {
      this._company = new Company(iCompany);
    } else {
      this._company = new Company();
    }
    this.setHolidays();
  }
  get company(): Company {
    if (this._company) {
      return this._company;
    }
    return new Company();
  }
  holidays: ListItem[] = [];
  selected: string = 'new'
  holiday?: CompanyHoliday
  holidayForm: FormGroup;
  showSortUp: boolean = false;
  showSortDown: boolean = false;
  actualDates: ListItem[] = [];
  actualSelected: string = '';

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected teamService: TeamService,
    protected dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.holidayForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern("^[HF][0-9]+$")]],
      name: ['', [Validators.required]],
      actual: new Date(),
    });
  }

  setHolidays() {
    this.holidays = [];
    this.holidays.push(new ListItem('new', 'Add New Holiday'));
    if (this.company.holidays) {
      const holidays = this.company.holidays.sort((a,b) => a.compareTo(b));
      holidays.forEach(hol => {
        const label = `${hol.id} - ${hol.name}`;
        this.holidays.push(new ListItem(hol.id, label));
      });
    }
  }

  getButtonClass(id: string) {
    let answer = 'employee';
    if (this.selected === id) {
      answer += ' active';
    }
    return answer;
  }

  getActualButtonClass(id: string) {
    let answer = 'employee';
    if (this.selected === id) {
      answer += ' active';
    }
    return answer;
  }

  onSelect(id: string) {
    this.selected = id;
    this.actualDates = [];
    this.showSortDown = false;
    this.showSortUp = false;
    if (this.company.holidays) {
      const holidays = this.company.holidays.sort((a,b) => a.compareTo(b));
      for (let i=0; i < holidays.length; i++) {
        if (holidays[i].id === id) {
          this.holiday = holidays[i];
          if (i > 0) {
            this.showSortUp = true;
          }
          if (i < holidays.length - 1) {
            this.showSortDown = true;
          }
          this.setHoliday();
        }
      }
    } 
    if (id === 'new') {
      this.holiday = undefined;
      this.setHoliday();
    }
  }

  getDateString(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec'];
    return`${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  setHoliday() {
    this.actualDates = [];
    this.actualSelected = '';
    if (this.holiday) {
      const actuals = this.holiday.actualdates.reverse();
      if (actuals.length > 0) {
        this.actualSelected = `${actuals[0].getTime()}`;
      }
      actuals.forEach(act => {
        this.actualDates.push(new ListItem(`${act.getTime()}`, 
          this.getDateString(act)));
      });
      this.holidayForm.controls['id'].setValue(this.holiday.id);
      this.holidayForm.controls['name'].setValue(this.holiday.name);
      this.holidayForm.controls['actual'].setValue(actuals[0]);
    } else {
      this.holidayForm.controls['id'].setValue('');
      this.holidayForm.controls['name'].setValue('');
      this.holidayForm.controls['actual'].setValue(new Date());
    }
  }

  onChangeSort(direction: string) {

  }
}
