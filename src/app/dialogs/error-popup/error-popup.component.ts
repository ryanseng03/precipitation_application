import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-popup',
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.scss']
})
export class ErrorPopupComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ErrorPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {
  }

}
