import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }

  roundToInterval = (value: number, interval: number, direction: "up" | "down" | "nearest" = "nearest"): number => {
    let sign = Math.sign(value);
    let abs = Math.abs(value);
    let roundingFunct: (value: number) => number;
    switch(direction) {
      case "down": {
        roundingFunct = Math.floor;
        break;
      }
      case "up": {
        roundingFunct = Math.ceil;
        break;
      }
      case "nearest": {
        roundingFunct = Math.round;
        break;
      }
    }
    return roundingFunct(abs / interval) * interval * sign;
  }
}
