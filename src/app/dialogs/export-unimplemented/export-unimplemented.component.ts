import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-export-unimplemented',
  templateUrl: './export-unimplemented.component.html',
  styleUrls: ['./export-unimplemented.component.scss']
})
export class ExportUnimplementedComponent {

  constructor(
    public dialogRef: MatDialogRef<ExportUnimplementedComponent>,
    @Inject(MAT_DIALOG_DATA) public data: null) {}

  exit(): void {
    this.dialogRef.close();
  }

}
