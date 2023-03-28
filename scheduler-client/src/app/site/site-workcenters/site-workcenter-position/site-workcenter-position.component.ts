import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ListItem } from 'src/app/generic/button-list/listitem';
import { Employee } from 'src/app/models/employees/employee';
import { ISite, Site } from 'src/app/models/sites/site';
import { IWorkcenter, Position, Workcenter } from 'src/app/models/sites/workcenter';
import { SiteResponse } from 'src/app/models/web/siteWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { SiteService } from 'src/app/services/site.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-site-workcenter-position',
  templateUrl: './site-workcenter-position.component.html',
  styleUrls: ['./site-workcenter-position.component.scss']
})
export class SiteWorkcenterPositionComponent {
  private _site: Site = new Site();
  private _workcenter: Workcenter = new Workcenter();
  @Input()
  public set site(site: ISite) {
    this._site = new Site(site);
  }
  get site(): Site {
    return this._site;
  }
  @Input()
  public set workcenter(wkctr: IWorkcenter) {
    this._workcenter = new Workcenter(wkctr);
    this.setPositions();
  }
  get workcenter(): Workcenter {
    return this._workcenter;
  }
  positions: ListItem[] = [];
  selected: string = 'new';
  position: Position = new Position();
  employees: Employee[] = [];
  shiftForm: FormGroup;
  showSortUp: boolean = true;
  showSortDown: boolean = true;
  teamid: string = '';

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private fb: FormBuilder) {
    this.shiftForm = this.fb.group({
      id: ['', [Validators.required]],
      name: ['', [Validators.required]],
      assigned: [],
    });
    this.employees = [];
    if (this.site.employees) {
      this.site.employees.forEach(emp => {
        this.employees.push(new Employee(emp));
      })
    }
  }

  setPositions(): void {
    this.positions = [];
    this.showSortDown = false;
    this.showSortUp = false;
    this.positions.push(new ListItem('new', 'Add New Position'));
    if (this.workcenter.positions) {
      const posits = this.workcenter.positions.sort((a,b) => a.compareTo(b));
      for (let i=0; i < posits.length; i++) {
        this.positions.push(new ListItem(posits[i].id, posits[i].name));
        if (posits[i].id === this.selected) {
          this.showSortUp = (i > 0);
          this.showSortDown = (i < posits.length - 1);
        }
      }
    }
  }

  selectPosition(id: string) {
    this.selected = id;
    this.setPositions();
  }

  getButtonStyle(id: string): string {
    if (id.toLowerCase() === this.selected.toLowerCase()) {
      return "employee active";
    }
    return "employee";
  }

  onChangeSort(direction: string) {
    this.authService.statusMessage = "Changing Sort Position";
    this.dialogService.showSpinner();
    this.siteService.updateWorkcenterPosition(this.teamid, this.site.id, 
      this.workcenter.id, this.selected, 'move', direction).subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: SiteResponse | null = resp.body;
        if (data && data != null && data.site) {
          const site = this.siteService.getSite();
          if (site) {
            if (site.id === data.site.id) {
              this.site = new Site(data.site);
              this.siteService.setSite(new Site(data.site));
              if (this.site.workcenters) {
                this.site.workcenters.forEach(wc => {
                  if (wc.id === this.workcenter.id) {
                    this.workcenter = new Workcenter(wc);
                  }
                });
              }
            }
          }
          this.teamService.setSelectedSite(new Site(data.site));
        }
        this.authService.statusMessage = "Retrieval complete"
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.error.exception;
      }
    });
  }
}
