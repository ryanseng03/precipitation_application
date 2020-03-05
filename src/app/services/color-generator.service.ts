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

  //needs some work
  getDefaultMonochromaticRainfallColorScale() {
    let parts = 450;
    let max = Math.pow(400, 2);
    let range: [number, number] = [0, 400];
    let colors = ["#f7fbff", "#6baed6", "#08519c", "#08306b"];
    //let colors = ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"];

    let colorScale = chroma.scale(colors).domain(range);
    
    let getColor = (value) => {
      value = Math.pow(value, 1);
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