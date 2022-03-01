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
        let color = colorFunct(value);
        for(let channel in color) {
          color[channel] = Math.round(color[channel]);
        }
        this.colors.push(color);
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

    getRange(): [number, number] {
      return this.range;
    }

    getColors(): Color[] {
      return this.colors;
    }

    getColorsHex(): string[] {
      return this.colors.map((color: Color) => {
        let r = color.r.toString(16).padStart(2, "0");
        let g = color.g.toString(16).padStart(2, "0");
        let b = color.b.toString(16).padStart(2, "0");
        let cstring = `#${r}${g}${b}`;
        return cstring;
      });
    }
  }
  