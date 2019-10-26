export interface Color {
    r: number,
    g: number,
    b: number,
    a: number
  }
  
  export class ColorScale {
    private colors: Color[];
    private range: [number, number];
  
    //scale allows for different scalings to be introduced, e.g. for an exponential scaling, should return value squared
    constructor(colorFunct: (value: number) => Color, range: [number, number], numColors: number, scale?: (normalizedValue: number) => number) {
      if(scale == undefined) {
        scale = (normalizedValue: number) => {
          return normalizedValue;
        }
      }
  
      this.colors = [];
      this.range = range;
  
      let span = range[1] - range[0];
      //intervals need to be scaled!!!
      let interval = span / numColors;
      let value: number;
      let i: number;
      for(i = 0, value = 0; i < numColors; i++, value += interval) {
        this.colors.push(colorFunct(value));
      }
    }
  
    getColor(value: number): Color {
      let span = this.range[1] - this.range[0];
  
      let offset: number;
      //if beyond range then scale to extrema
      if(value < this.range[0]) {
        offset = 0;
      }
      else if(value > this.range[1]) {
        offset = span;
      }
      //otherwise scale as offset
      else {
        offset = value - this.range[0];
      }
  
      let values = this.colors.length;
  
      //get scale of offset (0-1)
      let scale = offset / span;
      //get position in value array scale
      let pos = scale * (values - 1);
      //get nearest index
      let index = Math.round(pos);
      let color = this.colors[index];
  
      return color;
    }
  }
  