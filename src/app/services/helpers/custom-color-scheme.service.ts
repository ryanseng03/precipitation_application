import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomColorSchemeService {

  numCustom = 0;

  constructor() { }

  generateTag() {
    //tag should only be generated if submitted, tag can never be duplicated so long as storage mechanism uses this since using custom id, so no verification needed
    return `custom_${this.numCustom++}`;
  }
  
  getDefaultName(illegal: Set<string> = null): string {
    //start as the number of custom schemes that have had tags generated, check if name is legal based on provided set, verifies that a forward name wasn't manually provided to prevent duplicates
    //add 1 so start at 1
    let customNameI = this.numCustom + 1;
    let defaultName = `Custom Scheme ${customNameI}`;
    while(illegal !== null && illegal.has(defaultName)) {
      defaultName = `Custom Scheme ${++customNameI}`;
    }
    return defaultName;
  }
}
