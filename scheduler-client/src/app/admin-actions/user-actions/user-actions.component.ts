import { Component } from '@angular/core';
import { User } from 'src/app/models/users/user';
import { UsersResponse } from 'src/app/models/web/userWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';

@Component({
  selector: 'app-user-actions',
  templateUrl: './user-actions.component.html',
  styleUrls: ['./user-actions.component.scss']
})
export class UserActionsComponent {
  users: User[] = [];
  selected: User = new User();

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService
  ) {
    this.authService.statusMessage = "Retrieving All Users";
    this.dialogService.showSpinner();
    this.authService.getAllUsers().subscribe({
      next: resp => {
        this.dialogService.closeSpinner();
        if (resp.headers.get('token') !== null) {
          this.authService.setToken(resp.headers.get('token') as string);
        }
        const data: UsersResponse | null = resp.body;
        if (data && data !== null) {
          this.users = [];
          data.users.forEach(u => {
            this.users.push(new User(u));
          });
          this.users.sort((a,b) => a.compareTo(b));
        }
      },
      error: err => {
        this.dialogService.closeSpinner();
        this.authService.statusMessage = err.exception;
      }
    });
  }

  onSelect(id: string) {
    if (id === 'new') {
      this.selected = new User();
    } else {
      this.users.forEach(usr => {
        if (usr.id === id) {
          this.selected = new User(usr);
        }
      });
    }
  }

  getEmployeeClass(id: string): string {
    let answer = "employee";
    const now = new Date();
    if (id === this.selected.id) {
      answer += ' selected';
    } else {
      let found = false;
      this.users.forEach(usr => {
        if (usr.id === id) {
          found = true;
          if (usr.passwordExpires.getTime() < now.getTime()) {
            answer += ' expired';
          } else if (usr.badAttempts > 2) {
            answer += ' locked';
          } else {
            answer += ' active';
          }
        }
      });
      if (!found) {
        answer += ' active';
      }
    }
    return answer;
  }

  getListHeight(): string {
    let height = window.innerHeight - 225;
    return `height: ${height}px;`;
  }
}
