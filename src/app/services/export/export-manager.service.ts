import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import * as JSZip from "jszip";
import { DbConService, Config } from '../dataLoaders/dataRequestor/auxillary/dbCon/db-con.service';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ExportManagerService {

  fileData = {
    rasters: [],
    stations: [{
      file: "t",
      requires: []
    }]
  }

  static readonly EXPORT_BASE_URL = "https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data/Rainfall/";

  //sizes in MB
  static readonly MAX_INTERNAL_PACKAGE_SIZE = 100;
  static readonly GEOTIFF_SIZE = 25;
  static readonly METADATA_SIZE = 2;
  static readonly STATION_DATA = 20;

  constructor(private http: HttpClient, private dbcon: DbConService) {

  }

  getStation() {

  }

  private getFile(file: FileData) {
    let url = `${ExportManagerService.EXPORT_BASE_URL}${file.file}`;
    
    this.dbcon.initPromise.then((config: Config) => {

      let head = new HttpHeaders()
      .set("Authorization", "Bearer " + config.oAuthAccessToken)
      .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        headers: head
      };

      //remember error manager and dialogs

      this.http.get(url, options)
      .pipe(
        retry(3),
        take(1),
        catchError((e: HttpErrorResponse) => {
          return throwError(e);
        })
      )
      .subscribe((response: any) => {
        this.resolve(response);
      }, (error: any) => {
        let reject: RequestReject = {
          cancelled: this.cancelled,
          reason: `Error querying url ${url}: ${error}`
        };
        this.reject(reject);
      }, () => {
        if(this.cancelled) {
          let reject: RequestReject = {
            cancelled: true,
            reason: null
          }
          this.reject(reject);
        }
      });

    });

    

  }

  private createPackage() {
    //JSZip.generateAsync
  }
}

export interface FileData {
  label: string,
  file: string,
  required: string[]
}