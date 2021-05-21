import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorPopupComponent } from 'src/app/dialogs/error-popup/error-popup.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorPopupService {

  constructor(private dialog: MatDialog) { }

  notify(error: string) {
    const dialogRef = this.dialog.open(ErrorPopupComponent, {
      width: '250px',
      data: error
    });
  }
}
