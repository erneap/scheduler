import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from 'src/app/models/employees/employee';
import { Message } from 'src/app/models/web/employeeWeb';
import { AuthService } from 'src/app/services/auth.service';
import { DialogService } from 'src/app/services/dialog-service.service';
import { EmployeeService } from 'src/app/services/employee.service';
import { SiteIngestService } from 'src/app/services/site-ingest.service';

@Component({
  selector: 'app-file-ingest',
  templateUrl: './file-ingest.component.html',
  styleUrls: ['./file-ingest.component.scss']
})
export class FileIngestComponent {
  ingestForm: FormGroup;
  myFiles: File[] = [];

  constructor(
    protected authService: AuthService,
    protected dialogService: DialogService,
    protected empService: EmployeeService,
    protected ingestService: SiteIngestService,
    private fb: FormBuilder
  ) {
    this.ingestForm = this.fb.group({
      file: ['', [Validators.required]],
    });
  }

  onFileChange(event: any) {
    for (let i=0; i < event.target.files.length; i++) {
      this.myFiles.push(event.target.files[i]);
    }
  }

  onClear() {
    this.myFiles = [];
    this.ingestForm.controls["file"].setValue('');
  }

  onSubmit() {
    const iEmp = this.empService.getEmployee();
    if (iEmp) {
      const formData = new FormData();
      const emp = new Employee(iEmp);
      formData.append("team", emp.team);
      formData.append("site", emp.site);
      formData.append("company", emp.data.companyinfo.company);
      this.myFiles.forEach(file => {
        formData.append("file", file);
      });

      this.authService.statusMessage = "Ingesting Timecard Information";
      this.dialogService.showSpinner();
      this.ingestService.fileIngest(formData).subscribe({
        next: resp => {
          this.dialogService.closeSpinner();
            if (resp.headers.get('token') !== null) {
              this.authService.setToken(resp.headers.get('token') as string);
            }
            const data: Message | null = resp.body;
            if (data && data !== null) {
              this.authService.statusMessage = data.message
            }
            this.ingestForm.controls["file"].setValue('');
            this.myFiles = [];
        },
        error: err => {
          this.dialogService.closeSpinner();
          this.authService.statusMessage = err.eessage;
        }
      });
    }
  }
}
