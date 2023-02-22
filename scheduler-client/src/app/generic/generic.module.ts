import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonListComponent } from './button-list/button-list.component';
import { ButtonDivComponent } from './button-list/button-div/button-div.component';



@NgModule({
  declarations: [
    ButtonListComponent,
    ButtonDivComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ButtonListComponent
  ]
})
export class GenericModule { }
