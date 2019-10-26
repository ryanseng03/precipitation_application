import { Injectable } from '@angular/core';
import * as chroma from "chroma-js";
import {Color, ColorScale} from "../classes/color-scale"

@Injectable({
  providedIn: 'root'
})
export class ColorGeneratorService {

  constructor() {
    
  }


  getDefaultRainbowRainfallColorScale() {
    let parts = 450;
    let range: [number, number] = [0, 750];

    let colorScale = chroma.scale(['red','yellow','green','blue','purple','indigo']).domain(range);
      
    let getColor = (value) => {
      let color = colorScale(value);
      return {
        r: color._rgb[0],
        g: color._rgb[1],
        b: color._rgb[2],
        a: color._rgb[3] * 255
      };
    }

    

    return new ColorScale(getColor, range, parts);
  }

    
}



