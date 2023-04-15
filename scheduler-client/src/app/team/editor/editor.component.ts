import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITeam, Team } from 'src/app/models/teams/team';
import { SiteResponse } from 'src/app/models/web/siteWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  private _team: Team;
  @Input()
  public set team(iTeam: ITeam) {
    this._team = new Team(iTeam);
    this.setTeam();
  }
  get team(): Team {
    return this._team;
  }
  teamForm: FormGroup;

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected teamService: TeamService,
    private fb: FormBuilder
  ) {
    this._team = new Team(this.teamService.getTeam());
    this.teamForm = this.fb.group({
      name: ['', [Validators.required]],
    });
    this.setTeam();
  }

  setTeam() {
    this.teamForm.controls['name'].setValue(this.team.name);
  }

  onUpdate() {
    this.authService.statusMessage = "Updating Team Name";
    this.dialogService.showSpinner();
    this.teamService.updateTeam(this.team.id, this.teamForm.value.name).subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: SiteResponse | null = resp.body;
        if (data && data != null && data.team) {
          this.team = data.team;
          this.teamService.setTeam(data.team);
        }
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.error.exception;
      }
    });
  }
}
