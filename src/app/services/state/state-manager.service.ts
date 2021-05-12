import { Injectable } from '@angular/core';
import Moment from "moment";
//import { StationData } from "../../models/StationMetadata";

@Injectable({
  providedIn: 'root'
})
export class StateManagerService {

  state: {
    descriptors: number[]
    //station: StationData
    visData: {
      timeseries: null
    }
  }

  //application state
  //allow subscriptions to specific portions, 

  //dataset composer

  //dataset

  //station select

  constructor() { }
}

class StateManager {

}

//
interface Timeseries {

  range: [Moment.Moment, Moment.Moment]
}
