import { Component, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorPopupComponent } from 'src/app/dialogs/error-popup/error-popup.component';
import { InfoPopupComponent } from 'src/app/dialogs/info-popup/info-popup.component';


@Injectable({
  providedIn: 'root'
})
export class ErrorPopupService {

  private popupChain: Promise<void>;

  constructor(private dialog: MatDialog) {
    this.popupChain = Promise.resolve();
  }

  notify(type: string, message: string) {
    this.popupChain = this.popupChain.then(() => {
      let component: any;
      switch(type) {
        case "error": {
          component = ErrorPopupComponent;
          break;
        }
        case "info": {
          component = InfoPopupComponent;
          break;
        }
      }
      const dialogRef = this.dialog.open(component, {
        width: "50%",
        height: "50%",
        data: message
      });

      return dialogRef.afterClosed().toPromise();
    });

  }
}
