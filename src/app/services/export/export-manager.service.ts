import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { RequestFactoryService } from '../requests/request-factory.service';
import { retry, catchError } from 'rxjs/operators';
import { Observable, Subject, throwError } from "rxjs";
import { ResourceReq } from 'src/app/models/exportData';
import { UnitOfTime } from '../dataset-form-manager.service';
import { Moment } from 'moment';

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

  //lets just set a maximum number of files instead of a size for simplicity
  static readonly MAX_INSTANT_PACKAGE_FILES = 150;
  // static readonly AVERAGE_FILE_SIZE = 1;
  static readonly F_PART_SIZE_UL_MB = 4;


  constructor(private http: HttpClient, private reqFactory: RequestFactoryService) {

  }

  async submitEmailPackageReq(reqs: ResourceReq[], email: string): Promise<void> {
    let reqBody = {
      data: reqs,
      email: email
    };
    let req = await this.reqFactory.submitEmailPackageReq(reqBody);
    return req.toPromise();
  }

  async submitInstantDownloadReq(reqs: ResourceReq[], email: string): Promise<Observable<number>> {
    let reqBody = {
      data: reqs,
      email: email
    };
    let req = await this.reqFactory.submitInstantDownloadReq(reqBody);
    return req.toPromise()
    .then((files: string[]) => {
      let downloadData: DownloadData = this.getFiles(files);
      //when data download finished download to browser
      downloadData.data.then((data: Blob) => {
        this.downloadBlob(data, ExportManagerService.EXPORT_PACKAGE_NAME);
      });
      //resolve with data monitor
      return downloadData.progress;
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

  //keep handling this stuff here since it's more complex than the generic request handling is meant to handle and don't need config or anything
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
    start: Moment,
    end: Moment
  },
  period: UnitOfTime
}


interface DownloadData {
  progress: Observable<number>,
  data: Promise<Blob>
}


export interface ExportInfo {
  dateInfo?: FileDateInfo,
  baseURL: string,
  files: FileData[]
}

interface FileDateInfo {
  dates: [Moment, Moment],
  period: string,
}


interface ValueLayer {
  values: ValueInfo[]
}

interface ValueInfo {
  value: string,
  next: ValueLayer
}