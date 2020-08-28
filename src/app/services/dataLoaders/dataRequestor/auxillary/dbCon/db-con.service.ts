import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, merge, of } from 'rxjs';
import { map, retry, catchError, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DbConService {

  static readonly TOKEN_FILE = "./assets/APIToken.txt";
  static readonly MAX_URI = 2000;
  static readonly MAX_POINTS = 10000;

  private oAuthAccessToken = "token";
  private initPromise;

  constructor(private http: HttpClient) {

    this.initPromise = this.http.get(DbConService.TOKEN_FILE, { responseType: "text" }).toPromise().then((data) => {
      this.oAuthAccessToken = data;
    });
  }

  query<T>(query: string, resultHandler: (result: any) => T, offset: number = 0): Promise<T> {
    interface ResponseResults {
      result: any
    }

    return this.initPromise.then(() => {
      let url = `https://agaveauth.its.hawaii.edu/search/v2/data?q=${encodeURI(query)}&limit=${DbConService.MAX_POINTS}&offset=${offset}`;

      if(url.length > DbConService.MAX_URI) {
        throw new Error("Query too long.");
      }

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
          return Observable.throw(e);
        })
      ).toPromise().then((response: ResponseResults) => {
        return resultHandler(response.result);
      });

      return results;

    });
  }
}
