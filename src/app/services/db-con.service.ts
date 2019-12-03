import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, merge, of } from 'rxjs';
import { map, retry, catchError, mergeMap } from 'rxjs/operators';
import {SiteMetadata} from "../models/SiteMetadata"
import { LatLng } from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class DbConService {

  static readonly TOKEN_FILE = "/assets/APIToken.txt"
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;

  private oAuthAccessToken = "token";
  private initPromise;

  constructor(private http: HttpClient) {

    this.initPromise = this.http.get(DbConService.TOKEN_FILE, { responseType: "text" }).toPromise().then((data) => {
      this.oAuthAccessToken = data;
    });
  }


  getSiteMeta(): Promise<SiteMetadata[]> {
    interface ResponseResults {
      result: any
    }

    return this.initPromise.then(() => {
      console.log(this.oAuthAccessToken);
      let query = "{'name':{'$in':['RainfallStation']}}";
      let url = "https://ikeauth.its.hawaii.edu/meta/v2/data?q=" + encodeURI(query) + "&limit=" + DbConService.MAX_POINTS + "&offset=0";
  
      let head = new HttpHeaders()
      .set("Authorization", "Bearer " + this.oAuthAccessToken)
      .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        headers: head
      };
  
      let results = this.http.get<ResponseResults>(url, options)
      .pipe(
        retry(3),
        catchError((e) => {
          return Observable.throw(new Error(e.message));
        })
      ).toPromise().then((response: ResponseResults) => {
        console.log(response);
        let metadata: SiteMetadata[] = [];
        response.result.forEach((result) => {
          let metadatum: SiteMetadata = {
            name: result.value.name,
            location: new LatLng(result.value.latitude, result.value.longitude),
            network: result.value.network,
            value: null
          };
          metadata.push(metadatum);
        });
        return metadata;
      });
  
      return results;
  
    });
  }
}
