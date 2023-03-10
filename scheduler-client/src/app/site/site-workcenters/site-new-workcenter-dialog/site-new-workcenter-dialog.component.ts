import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface NewWorkcenterDialogData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-site-new-workcenter-dialog',
  templateUrl: './site-new-workcenter-dialog.component.html',
  styleUrls: ['./site-new-workcenter-dialog.component.scss']
})
export class SiteNewWorkcenterDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SiteNewWorkcenterDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: NewWorkcenterDialogData,
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}
