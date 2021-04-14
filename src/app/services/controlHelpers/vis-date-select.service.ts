import { Injectable } from '@angular/core';
import Moment from "moment";
import { DataManagerService, MovementVector } from '../dataManager/data-manager.service';

@Injectable({
  providedIn: 'root'
})
export class VisDateSelectService {
  date: Moment.Moment;

  constructor(private dataManager: DataManagerService) { }


  setDate(date: Moment.Moment, movementInfo: MovementVector) {
    //if(this.date) {
    this.dataManager.getData(date, movementInfo);
    // }
    // this.date = date;
  }
}
