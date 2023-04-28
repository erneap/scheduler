import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserActionsComponent } from './user-actions/user-actions.component';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserActionsProfileComponent } from './user-actions/user-actions-profile/user-actions-profile.component';

@NgModule({
  declarations: [
    UserActionsComponent,
    UserActionsProfileComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminActionsModule { }
