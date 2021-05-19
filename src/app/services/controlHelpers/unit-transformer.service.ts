import { Injectable } from '@angular/core';
import { UnitConversionService } from "../util/unit-conversion.service";

@Injectable({
  providedIn: 'root'
})
export class UnitTransformerService {

  // unitAbbreviationNames = {
  //   "C": "celcius",
  //   "F": "fahrenheit",
  //   "K": "kelvin",
  //   "in": "inches",
  //   "mm": "millimeters"
  // };

  unitMap = {
    C: {
      name: "celcius",
      conversions: {
        F: this.converter.c2f,
        K: this.converter.c2k
      }
    },
    F: {
      name: "fahrenheit",
      conversions: {
        C: this.converter.f2c,
        K: this.converter.f2k
      }
    },
    K: {
      name: "kelvin",
      conversions: {
        F: this.converter.k2f,
        C: this.converter.k2c
      }
    },

    in: {
      name: "inches",
      conversions: {
        mm: this.converter.in2mm
      }
    },
    mm: {
      name: "millimeters",
      conversions: {
        in: this.converter.mm2in
      }
    }
  };


  private baseData = {
    raster: []

  }

  private unit = "mm"

  setUnit(unit: string) {
    let conversion = this.unitMap[this.unit].conversions[unit];
    if(unit) {

    }
    else { 
      console.error("No unit conversion found.");
    }
  }

  getUnits(): string {
    return
  }

  constructor(private converter: UnitConversionService) { }
}
