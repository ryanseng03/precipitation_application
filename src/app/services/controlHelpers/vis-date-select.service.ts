import { Injectable } from '@angular/core';
import Moment from "moment";
import { MovementVector } from '../dataManager/data-manager.service';
import { EventParamRegistrarService } from '../inputManager/event-param-registrar.service';

@Injectable({
  providedIn: 'root'
})
export class VisDateSelectService {
  date: Moment.Moment;

  constructor(private paramService: EventParamRegistrarService) { }


  setDate(date: Moment.Moment, movementInfo: MovementVector) {
    this.paramService.pushDate(date);
  }
}
