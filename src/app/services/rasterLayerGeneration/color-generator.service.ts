import { Injectable } from '@angular/core';
import * as chroma from "chroma-js";
import {Color, ColorScale} from "../../models/colorScale";
import xml2js from "xml2js";
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ColorGeneratorService {

  constructor(private http: HttpClient) {
    
  }


  getDefaultRainbowRainfallColorScale(): ColorScale {
    let parts = 450;
    let range: [number, number] = [0, 750];

    let colorScale = chroma.scale(['red','yellow','green','blue','purple','indigo']).domain(range);
      
    let getColor = (value: number) => {
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

  //needs some work, actually pretty decent, can look at tacc stuff
  getDefaultMonochromaticRainfallColorScale(): ColorScale {

    let parts = 450;
    //let max = Math.pow(400, 2);
    let range: [number, number] = [0, 750];
    let colors = ["#f7fbff", "#6baed6", "#08519c", "#08306b"];
    //let colors = ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"];

    let colorScale = chroma.scale(colors).domain(range).correctLightness();
    
    let getColor = (value: number) => {
      //value = Math.pow(value, 1);
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

  getColorSchemeFromXML(xmlFile: string): Promise<any> {

    let parts = 450;
    let range: [number, number] = [0, 750];
    let parser = new xml2js.Parser();

    //chroma.scale(['yellow', 'lightgreen', '008ae5']).domain([0,0.25,1]);

    return this.http.get(xmlFile, { responseType: "text" }).toPromise().then((data: string) => {
      return new Promise((resolve, reject) => {
        parser.parseString(data, (err, result) => {
          let points = result.ColorMaps.ColorMap[0].Point;
          console.log(points);
          let colors = [];
          let domain = [];
          let span = range[1] - range[0];
          //parse points
          for(let point of points) {
            let x = parseFloat(point.$.x) * span + range[0];
            let r = parseFloat(point.$.r) * 255;
            let g = parseFloat(point.$.r) * 255;
            let b = parseFloat(point.$.r) * 255;
            let color = [r, g, b]
            colors.push(color);
            domain.push(x);
          }
          let colorScaleF = chroma.scale(colors).domain(domain);

          let getColor = (value: number) => {
            //value = Math.pow(value, 1);
            let color = colorScaleF(value);
            return {
              r: color._rgb[0],
              g: color._rgb[1],
              b: color._rgb[2],
              a: color._rgb[3] * 255
            };
          }

          let colorScale = new ColorScale(getColor, range, parts);
          resolve(colorScale);
        });
      });
    });

  }
    


    
}