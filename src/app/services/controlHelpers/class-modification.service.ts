import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClassModificationService {

  constructor() { }

  setAttributesInAncestorWithClass(rootElement: HTMLElement, className: string, attributes: PropertyDescriptorMap): boolean {
    let success = false;
    let element: HTMLElement = this.recursiveFindClassInParent(rootElement, className);
    if(element !== null) {
      Object.defineProperties(element.style, attributes);
      success = true;
    }
    return success;
  }

  private recursiveFindClassInParent(element: HTMLElement, className: string) {
    let parent = element.parentElement;
    if(parent === null) {
      return null;
    }
    let classes: DOMTokenList = parent.classList;
    if(classes.contains(className)) {
      return parent;
    }
    else {
      return this.recursiveFindClassInParent(parent, className);
    }
  }
}
