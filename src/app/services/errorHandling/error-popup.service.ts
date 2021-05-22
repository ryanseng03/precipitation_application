import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorPopupComponent } from 'src/app/dialogs/error-popup/error-popup.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorPopupService {

  popupChain: Promise<void>;

  constructor(private dialog: MatDialog) {
    this.popupChain = Promise.resolve();
  }

  notify(error: string) {
    this.popupChain = this.popupChain.then(() => {
      const dialogRef = this.dialog.open(ErrorPopupComponent, {
        width: "50%",
        height: "50%",
        data: error
      });

      return dialogRef.afterClosed().toPromise();
    });

  }
}
