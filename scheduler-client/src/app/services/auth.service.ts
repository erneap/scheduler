import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { IUser, User } from '../models/users/user';
import { AuthenticationResponse }
  from '../models/web/employeeWeb';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends CacheService {
  loginError: string = '';
  isAuthenticated = false;
  lastPage = '';
  isScheduler = false;
  isLeader = false;
  isAdmin = false;
  isCompanyLead = false;

  authStatus = new BehaviorSubject<IAuthStatus>( 
    this.getItem('authStatus') || defaultAuthStatus);

  private readonly authProvider: (email: string, password: string)
    => Observable<AuthenticationResponse>;

  constructor(
    public httpClient: HttpClient,
    private router: Router
  ) {
    super();
    this.authStatus.subscribe(authStatus => this.setItem('authStatus', 
      authStatus));
    this.authProvider = this.apiAuthProvider;
  }

  private apiAuthProvider(email: string, password: string)
    : Observable<AuthenticationResponse> {
    return this.httpClient.post<AuthenticationResponse>(
      '/scheduler/api/v1/user/logon', 
      { email: email, password: password });
  }

  logout() {
    this.clearToken();
    this.isAuthenticated = false;
    this.router.navigate(["/home"]);
  }

  public hasRole(role: string): boolean {
    const user = this.getUser();
    if (user) {
      return user.isInGroup("scheduler", role);
    } else {
      return false;
    }
  }

  getDecodedToken(): IAuthStatus {
    const token = this.getItem<string>('jwt');
    if (token) {
      return jwt_decode(token);
    } else {
      return defaultAuthStatus;
    }
  }

  getExpiredDate(): Date {
    return new Date(this.getDecodedToken().exp * 1000);
  }

  getUser(): User | undefined {
    const iUser = this.getItem<IUser>('current-user');
    if (iUser) {
      return new User(iUser);
    }
    return undefined;
  }

  setUser(iUser: IUser) {
    const user = new User(iUser);
    this.isScheduler = user.isInGroup("scheduler", "scheduler");
    this.isLeader = user.isInGroup("scheduler", "leader");
    this.isAdmin = user.isInGroup("scheduler", "admin");
    this.isCompanyLead = user.isInGroup("scheduler", "companylead");
    this.setItem('current-user', user);
  }
  
  getToken(): string {
    var token: string = this.getItem('jwt') || ''
    if (token !== '') { 
      this.isAuthenticated = true
    }
    return token
  }

  setToken(jwt: string) {
    this.setItem('jwt', jwt);
  }

  clearToken() {
    this.removeItem('jwt');
    this.removeItem('current-user');
  }
}

export interface IAuthStatus {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const defaultAuthStatus = { userId: '', email: '', iat: 0, exp: 0 }
