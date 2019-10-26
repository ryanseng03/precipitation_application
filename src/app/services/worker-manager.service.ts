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

  // getWorker() {
  //   let worker = null;
  //   //if max number of workers not hit create new worker
  //   if(this.created < WorkerManagerService.MAX_WORKERS) {
  //     //create WorkerHandler with new web worker
  //   }
  //   else {
  //     if(this.suspended.length > 0) {
  //       worker = this.suspended.shift();
        
  //     }
  //   }

  //   return new WorkerHandler(worker);
  // }

  //worker should exit if receive exit signal
  private workerExecWrapper() {

  }
}


//each worker has a worker manager, worker handlers assigned to worker managers by the worker coordinator
//worker coordinator should know how many handlers in which managers, which managers are busy, manager periodicity?
//note workers can't have method replaced, need to stop original worker, then create new worker with new function


//load balance worker managers
class WorkerCoordinator {
  //Subject<WorkerUtilInfo>
}

interface WorkerUtilInfo {
  //handler: WorkerHandler;
}

//handles swapping between
class WorkerManager {
  worker: Worker;
  removeF
}

export class WorkerHandler<T> {
  private workerExec;
  private worker: Worker;
  private manager: WorkerManager;

  constructor(worker: Worker, workerExec) {

    this.worker.onerror = () => {

    };
    this.worker.onmessage = () => {

    };
  }

  send(data: T) {
    //this.manager.sendMessageFromHandler(this);
    this.worker.postMessage(data);
  }

  //suspend worker, mark for priority (inactive) if a worker is needed for another process
  suspend() {

  }

  //stop the worker, no longer used
  stop() {

  }
}
