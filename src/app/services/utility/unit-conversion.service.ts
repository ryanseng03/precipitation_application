import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UnitConversionService {

  defaultScheme: string = "metric";

  


  unitSchemes: {
    metrics: {},
    si: {}
  };
  

  constructor() { }

  //convert raster
  //convert station data



  mm2in(mm: number): number {
    return mm * 25.4;
  }

  in2mm(inches: number): number {
    return inches / 25.4;
  }

  c2f(c: number) {
    return c * (9 / 5) + 32
  }

  f2c(f: number) {
    return (f - 32) / (9 / 5)
  }

  c2k(c: number): number {
    return c + 273.15;
  }

  f2k(f: number): number {
    return this.c2k(this.f2c(f));
  }

  k2c(k: number): number {
    return k - 273.15;
  }

  k2f(k: number): number {
    return this.c2f(this.k2c(k));
  }
}
