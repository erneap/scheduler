import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  reportForm: FormGroup;
  reportType: string = '';

  constructor(
    private fb: FormBuilder
  ) {
    this.reportForm = this.fb.group({
      reportType: '',
    });
  }

  onSelect() {
    console.log(this.reportForm.value.reportType);
    this.reportType = this.reportForm.value.reportType;
  }
}
