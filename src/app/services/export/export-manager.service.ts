import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { Config, DbConService } from '../dataLoader/auxillary/dbCon/db-con.service';
import { retry, catchError, take } from 'rxjs/operators';
import { Observable, Subject, throwError } from "rxjs";
import * as Moment from 'moment';
import { ValueData } from 'src/app/models/types';
import { DateManagerService } from '../dateManager/date-manager.service';
import { ResourceReq } from 'src/app/models/exportData';
import { AssetManagerService } from '../util/asset-manager.service';
import { UnitOfTime } from '../dataset-form-manager.service';

@Injectable({
  providedIn: 'root'
})
export class ExportManagerService {

  //Master_Sta_List_Meta_2020_11_09.csv
  fileData = {
    rasters: [],
    stations: [{
      label: "",
      file: "Master_Sta_List_Meta_2020_11_09.csv",
      requires: []
    }]
  };

  static readonly EXPORT_PACKAGE_NAME = "HCDP_data.zip"
  //config?
  static readonly EXPORT_BASE_URL = "https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data/";

  //lets just set a maximum number of files instead of a size for simplicity
  static readonly MAX_INSTANT_PACKAGE_FILES = 150;
  // static readonly AVERAGE_FILE_SIZE = 1;
  static readonly F_PART_SIZE_UL_MB = 4;

  ///////////////////////
  static readonly ENDPOINT_INSTANT = "https://cistore.its.hawaii.edu/genzip/instant/splitlink";
  static readonly ENDPOINT_EMAIL = "https://cistore.its.hawaii.edu/genzip/email/";
  ///////////////////////

  private initPromise: Promise<Config>;
  constructor(private http: HttpClient, private dbcon: DbConService, private dateService: DateManagerService, assetService: AssetManagerService) {
    let url = assetService.getAssetURL(DbConService.CONFIG_FILE);
    this.initPromise = <Promise<Config>>(this.http.get(url, { responseType: "json" }).toPromise());
  }

  async submitEmailPackageReq(reqs: ResourceReq[], email: string): Promise<void> {
    let config: Config = await this.initPromise;
    let reqBody = {
      data: reqs,
      email: email
    };
    let head = new HttpHeaders()
    .set("Authorization", "Bearer " + config.oAuthAccessToken);
    const responseType: "text" = "text";
    let reqOpts = {
      headers: head,
      responseType: responseType,
    };
    let endpoint = ExportManagerService.ENDPOINT_EMAIL;
    let start = new Date().getTime();
    return new Promise<void>((resolve, reject) => {
      this.http.post(endpoint, reqBody, reqOpts)
      .pipe(
        retry(3),
        take(1),
        catchError((e: HttpErrorResponse) => {
          return throwError(e);
        })
      )
      .subscribe((response: string) => {
        let time = new Date().getTime() - start;
        let timeSec = time / 1000;
        console.log(`Got request confirmation, time elapsed ${timeSec} seconds`);
        resolve();
      }, (error: any) => {
        console.error(error);
        reject(error);
      });
    });
  }

  async submitInstantDownloadReq(reqs: ResourceReq[], email: string): Promise<Observable<number>> {
    let config: Config = await this.initPromise;
    let reqBody = {
      data: reqs,
      email: email
    };
    let head = new HttpHeaders()
    .set("Authorization", "Bearer " + config.oAuthAccessToken);
    const responseType: "json" = "json";
    let reqOpts = {
      headers: head,
      responseType: responseType,
    };
    let endpoint = ExportManagerService.ENDPOINT_INSTANT;

    return new Promise<Observable<number>>((resolve, reject) => {
      let start = new Date().getTime()
      this.http.post(endpoint, reqBody, reqOpts)
        .pipe(
          retry(3),
          take(1),
          catchError((e: HttpErrorResponse) => {
            return throwError(e);
          })
        )
        .subscribe(async (response: any) => {
          let time = new Date().getTime() - start;
          let timeSec = time / 1000;
          console.log(`Got generated file names, time elapsed ${timeSec} seconds`);
          let files: string[] = response.files;
          let downloadData: DownloadData = this.getFiles(files);
          //resolve with data monitor
          resolve(downloadData.progress);
          //when data download finished download to browser
          downloadData.data.then((data: Blob) => {
            this.downloadBlob(data, ExportManagerService.EXPORT_PACKAGE_NAME);
          })
          .catch((e: any) => {/*error logging and all that should be handled elsewhere, progress monitor should also get error for popping up client message*/});
        }, (error: any) => {
          console.error(error);
          reject(error);
        });
    });
  }


  private downloadBlob(blob: Blob, name: string) {
    let url = window.URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }


  private getFiles(files: string[]): DownloadData {
    let progress = new Subject<number>();

    //progress is in bytes so multiply by 1024 * 1024
    let fileBaseSize = ExportManagerService.F_PART_SIZE_UL_MB * 1024 * 1024;
    let sizeUL = files.length * fileBaseSize;
    let percentCoeff = 100 / sizeUL;

    let data: Promise<Blob> = new Promise((resolve, reject) => {
      let responses: ArrayBuffer[] = new Array(files.length);
      let returnedResponses = 0;
      //shortcut, all but last file should be the base size, so start file transfers in reverse and just add last file size on first transfer if total size defined
      let actualSize = (files.length - 1) * fileBaseSize;
      //flag for if real size already determined
      let actualSizeFound = false;
      let progressStore: number[] = new Array(files.length).fill(0);
      let start = new Date().getTime();
      //start at end to speed up last file size receipt
      for(let i = files.length - 1; i >= 0; i--) {
        let file = files[i];
        this.getFile(file).subscribe((event: HttpEvent<ArrayBuffer>) => {
          if(event.type === HttpEventType.DownloadProgress) {
            //if this is the last file (odd man out) and the total size field in the event is populated then adjust the total package size and percent coeff
            if(!actualSizeFound && i == files.length - 1 && event.total) {
              actualSize += event.total;
              //recompute coeff
              percentCoeff = 100 / actualSize;
              actualSizeFound = true;
            }
            progressStore[i] = event.loaded;
            //reduce to total amount of data downloaded
            let loaded = progressStore.reduce((acc, value) => acc + value, 0);
            //convert to percent
            loaded *= percentCoeff;
            progress.next(loaded);
          }
          else if(event.type === HttpEventType.Response) {
            responses[i] = event.body;
            if(++returnedResponses === files.length) {
              let time = new Date().getTime() - start;
              let timeSec = time / 1000;
              console.log(`Got all zip data, time elapsed ${timeSec} seconds`);
              resolve(responses);
              progress.complete();
            }
          }
        });
      }
    })
    .then((responses: ArrayBuffer[]) => {
      return new Blob(responses, {type: "application/zip"});
    })
    .catch((e: any) => {
      //error out progress and reject
      progress.error(e);
      return Promise.reject(e);
    });

    return {
      progress: progress.asObservable(),
      data: data
    };
  }


  private getFile(url: string): Observable<HttpEvent<ArrayBuffer>> {
    let head = new HttpHeaders();
    const responseType: "arraybuffer" = "arraybuffer";
    const observe: "events" = "events";
    let options = {
      headers: head,
      responseType: responseType,
      reportProgress: true,
      observe: observe
    };

    return this.http.get(url, options)
    .pipe(
      retry(3),
      catchError((e: HttpErrorResponse) => {
        return throwError(e);
      })
    );
  }
}

export interface FileData {
  dates?: DateInfo,
  fields: {[item: string]: string | number}
}

export interface DateInfo {
  dates: {
    start: Moment.Moment,
    end: Moment.Moment
  },
  period: UnitOfTime
}

export interface ExportInfo {
  dateInfo?: FileDateInfo,
  baseURL: string,
  files: FileData[]
}

interface FileDateInfo {
  dates: [Moment.Moment, Moment.Moment],
  period: string,
}

interface DownloadData {
  progress: Observable<number>,
  data: Promise<Blob>
}