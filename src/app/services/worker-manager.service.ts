import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkerManagerService {

  static readonly MAX_WORKERS = navigator.hardwareConcurrency || 4;

  created: number;
  //set up as queue
  suspended: any[];

  constructor() { }

  getWorker() {
    let worker = null;
    //if max number of workers not hit create new worker
    if(this.created < WorkerManagerService.MAX_WORKERS) {
      //create WorkerHandler with new web worker
    }
    else {
      if(this.suspended.length > 0) {
        worker = this.suspended.shift();
        
      }
    }

    return new WorkerHandler(worker);
  }
}



export class WorkerHandler {
  private workerExec;

  //suspend worker, mark for priority (inactive) if a worker is needed for another process
  suspend() {

  }

  stop() {

  }
}
