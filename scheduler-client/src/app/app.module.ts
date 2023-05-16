import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { WaitDialogComponent } from './home/wait-dialog/wait-dialog.component';
import { MaterialModule } from './material.module';
import { AuthHttpInterceptor } from './services/auth-http-interceptor';
import { AuthService } from './services/auth.service';
import { DialogService } from './services/dialog-service.service';
import { PasswordExpireDialogComponent } from './home/password-expire-dialog/password-expire-dialog.component';
import { NavigationMenuComponent } from './home/navigation-menu/navigation-menu.component';
import { EmployeeModule } from './employee/employee.module';
import { NotFoundComponent } from './home/not-found/not-found.component';
import { EmployeeService } from './services/employee.service';
import { SiteService } from './services/site.service';
import { TeamService } from './services/team.service';
import { SiteModule } from './site/site.module';
import { SiteSchedulerModule } from './site-scheduler/site-scheduler.module';
import { SiteEmployeeModule } from './site-employee/site-employee.module';
import { GenericModule } from './generic/generic.module';
import { DeletionConfirmationComponent } from './generic/deletion-confirmation/deletion-confirmation.component';
import { TeamModule } from './team/team.module';
import { SiteIngestModule } from './site-ingest/site-ingest.module';
import { AdminActionsModule } from './admin-actions/admin-actions.module';
import { ReportsModule } from './reports/reports.module';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WaitDialogComponent,
    PasswordExpireDialogComponent,
    NavigationMenuComponent,
    NotFoundComponent,
    DeletionConfirmationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    EmployeeModule,
    SiteModule,
    SiteSchedulerModule,
    SiteEmployeeModule,
    SiteIngestModule,
    GenericModule,
    TeamModule,
    AdminActionsModule,
    ReportsModule
  ],
  exports: [
    DeletionConfirmationComponent
  ],
  providers: [AuthService, DialogService, EmployeeService, SiteService, 
    TeamService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
