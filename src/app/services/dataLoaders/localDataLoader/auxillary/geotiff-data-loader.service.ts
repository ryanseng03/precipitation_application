import { Injectable } from '@angular/core';
import { Subscription, throwError } from 'rxjs';
import { retry, catchError, take } from 'rxjs/operators';
import {RasterData, RasterHeader, BandData, IndexedValues, UpdateFlags, UpdateStatus} from "../../../../models/RasterData";
import {DataProcessorService} from "../../../dataProcessor/data-processor.service"
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';


@Injectable({
  providedIn: 'root'
})
export class GeotiffDataLoaderService {

  constructor(private http: HttpClient, private processor: DataProcessorService, private paramService: EventParamRegistrarService) {
  }

  getDataFromGeotiff(url: string, customNoData?: number, bands?: string[]): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      //send data buffer to data processor to convert to raster data
      return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, customNoData, bands);
    });
  }

  getDataFromExternalGeotiff(url: string, customNoData?: number, bands?: string[]): Promise<RasterData> {
    return this.http.get(url, {
      responseType: "arraybuffer"
    }).toPromise().then((data: ArrayBuffer) => {
      //send data buffer to data processor to convert to raster data
      return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, customNoData, bands);
    });
  }


}



// export class RequestResults {
//   private sub: Subscription;
//   private data: Promise<ArrayBuffer | ArrayBuffer[]>;
//   private http: HttpClient;
//   private retry: number;
//   private resolve: (value: any) => void;
//   private reject: (reason: any) => void;
//   private linked: RequestResults[];

//   cancelled: boolean;

//   constructor(http: HttpClient, retry: number = 3) {
//     this.http = http;
//     this.retry = retry;
//     this.cancelled = false;
//     this.data = new Promise<any>((resolve, reject) => {
//       this.resolve = resolve;
//       this.reject = reject;
//     });
//     // this.data.catch((reason: RequestReject) => {
//     //   console.log(reason);
//     //   //return Promise.reject(reason);
//     // });
//     this.linked = [];
//   }

//   get(url: string): void {
//     //console.log(query);
//     //if cancelled or already called ignore
//     if(!this.cancelled && !this.sub) {
//       let head = new HttpHeaders();
//       // .set("Authorization", "Bearer " + config.oAuthAccessToken)
//       // .set("Content-Type", "application/x-www-form-urlencoded");
//       let responseType: "arraybuffer" = "arraybuffer";
//       let options = {
//         responseType: responseType,
//         headers: head
//       };

//       this.sub = this.http.get(url, options)
//       .pipe(
//         retry(this.retry),
//         take(1),
//         catchError((e: HttpErrorResponse) => {
//           return throwError(e);
//         })
//       )
//       .subscribe((response: ArrayBuffer) => {
//         this.resolve(response)
//       }, (error: HttpErrorResponse) => {
//         let reject: RequestReject = {
//           cancelled: this.cancelled,
//           reason: `Error in query, status: ${error.status}, message: ${error.message}`
//         };
//         this.reject(reject);
//       }, () => {
//         if(this.cancelled) {
//           let reject: RequestReject = {
//             cancelled: true,
//             reason: null
//           }
//           this.reject(reject);
//         }
//       });
//     }
//   }

//   transform(onfulfilled: (value: any) => any) {
//     this.data = this.data.then(onfulfilled);
//   }

//   cancel(): void {
//     for(let link of this.linked) {
//       link.cancel();
//     }
//     this.cancelled = true;
//     //does this complete the stream?
//     this.sub.unsubscribe();
//     //this.outSource.complete();
//   }

//   combine(request: RequestResults): void {
//     this.linked.push(request);
//     let promises = [this.data];
//     for(let link of this.linked) {
//       promises.push(link.toPromise());
//     }
//     this.data = Promise.all(promises);
//     // this.data.catch((reason: RequestReject) => {
//     //   console.log(reason);
//     //   return Promise.reject(reason);
//     // });
//   }

//   toPromise(): Promise<ArrayBuffer> {
//     return this.data;
//   }

// }

// export interface RequestReject {
//   cancelled: boolean,
//   reason: any
// }




