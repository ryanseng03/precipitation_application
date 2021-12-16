
// // import Moment from "moment";
// import { latLng, LatLng } from "leaflet";
// // import { ValueData } from "./Dataset";

// export class Station {

//     private metadata: StationMetadata;
//     public value: number;
  
//     constructor(metadata: any, value?: number) {
//       this.value = value || null;
//       this.metadata = new Proxy(metadata);
//     }

//     private proxyHandler = {
//         get: (obj, prop) => {
//             return prop in obj
//         }
//     }
  
//     setValue(value: number): void {
//       this.value = value;
//     }
  
//     getValue(): number | null {
//       return this.value;
//     }
  
//     get id(): string {
//       return this.metadata.id;
//     }
  
//     get location(): LatLng {
//       return this.metadata.location;
//     }
  
//     get lat(): number {
//       return this.metadata.lat;
//     }
  
//     get lng(): number {
//       return this.metadata.lng;
//     }
  
//     get elevation(): number {
//       return this.metadata.elevation;
//     }
  
//     getFieldValue(field: string): Range | string {
//       return this.metadata.getFieldValue(field);
//     }
  
//     getExtFields(): string[] {
//       return this.metadata.getExtFields();
//     }
//   }