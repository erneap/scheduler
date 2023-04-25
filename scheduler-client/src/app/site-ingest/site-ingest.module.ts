import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIngestComponent } from './file-ingest/file-ingest.component';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    FileIngestComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SiteIngestModule { }
