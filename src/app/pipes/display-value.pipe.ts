import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'displayValue'
})
export class DisplayValuePipe implements PipeTransform {

  transform(value: any, special?: string): any {
    switch(special) {
      case undefined: 
      case "default": {
        return this.defaultFormat(value);
      }
      case "dateRange": {
        return this.formatWithDateRange(value);
      }
    }
    
  }

  defaultFormat(value: string): string {
    let replacement = (noCap?: Set<string>) => {
      return (match: string, boundary: string, word: string, first: string, rest: string): string => {
        let replace = match;
        if(noCap === undefined || !noCap.has(word.toLowerCase())) {
          replace = `${boundary}${first.toUpperCase()}${rest}`;
        }
        return replace;
      }
    };
    let prettifyString = (s: string, noCap?: Set<string>) => {
      let pretty = s;
      pretty = pretty.replace(/_/g, " ");
      pretty = pretty.replace(/(\b)((\w)(\w*))/g, replacement(noCap));
      return pretty;
    };
    return prettifyString(value);
  }

  formatWithDateRange(value: string) {
    let baseFormat = this.defaultFormat(value);
    let split = baseFormat.split(" ")
    let dateRange = split.slice(-2);
    let base = split.slice(0, -2).join(" ");
    return `${base} (${dateRange[0]} - ${dateRange[1]})`
  }

}
