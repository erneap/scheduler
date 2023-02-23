import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent {
  section: string = 'employee';
  constructor(
    public authService: AuthService,
  ) {
    
  }

  isInGroup(role: string): boolean {
    return this.authService.hasRole(role);
  }
}