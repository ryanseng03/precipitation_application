import { Injectable, NgZone } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParameterStoreService {

  private parametersSubjects: {[name: string]: BehaviorSubject<any>};
  private parametersState: {[name: string]: any};

  constructor(private ngZone: NgZone) {
    this.parametersSubjects = {};
    this.parametersState = {};
  }

  public registerParameter<T>(name: string, initValue: T = null): BehaviorSubject<T> {
    let paramSubject = null;
    //ensure this parameter does not already exist
    if(this.parametersSubjects[name] == undefined) {
      paramSubject = new BehaviorSubject<T>(initValue);
      this.parametersSubjects[name] = paramSubject;
      this.parametersState[name] = initValue;
    }
    return paramSubject;
  }

  public createParameterHook(paramName: string, cb: (value: any) => void, install: boolean = true): ParameterHook {
    let hook: ParameterHook = null;
    let subject: BehaviorSubject<any> = this.parametersSubjects[paramName];
    if(subject != undefined) {
      //use ngZone.run to execute callback, triggers change detection, functions called in rxjs subscriptions don't trigger by default
      let zonedCB = (value: any) => {
        this.ngZone.run(() => {
          cb(value);
        });
      };
      hook = new ParameterHook(subject, zonedCB);
      if(install) {
        hook.install();
      }
    }

    return hook;
  }

}



export class ParameterHook {
  private active: boolean;
  private sub: Subscription;
  private source: BehaviorSubject<any>;
  private cb: (value: any) => void;

  constructor(source: BehaviorSubject<any>, cb: (value: any) => void) {
    this.source = source;
    this.cb = cb;
  }

  install(): boolean {
    let installed = false;
    if(!this.active) {
      installed = true;
      this.active = true;
      this.sub = this.source.subscribe((value: any) => {
        this.cb(value);
      });
    }
    return installed;
  }

  uninstall(): boolean {
    let uninstalled = false;
    if(this.active) {
      uninstalled = true;
      this.active = false;
      this.sub.unsubscribe();
    }
    return uninstalled;
  }
}
