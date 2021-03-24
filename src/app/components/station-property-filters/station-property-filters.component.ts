import { Component, OnInit } from '@angular/core';
import { FilterOptions, StationFilteringService, StationMetadata } from 'src/app/services/filters/station-filtering.service';
import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-station-property-filters',
  templateUrl: './station-property-filters.component.html',
  styleUrls: ['./station-property-filters.component.scss']
})
export class StationPropertyFiltersComponent implements OnInit {

  stations: StationMetadata[];

  orGroups: FilterOptions

  all = [1, 2, 3, 4, 5, 6, 7, 8];
  even = [];
  odd = []

  constructor(private filterService: StationFilteringService) {
    this.stations = [];
    filterService.setStations(this.stations);


  }

  ngOnInit() {
  }

  moveToGroup(event: CdkDragDrop<number[]>) {
    console.log(event);
    if(event.previousContainer == event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  /** Predicate function that only allows even numbers to be dropped into a list. */
  evenPredicate(item: CdkDrag<number>) {
    console.log(item);
    return item.data % 2 === 0;
  }

  oddPredicate(item: CdkDrag<number>) {
    return item.data % 2 === 1;
  }

  /** Predicate function that doesn't allow items to be dropped into a list. */
  noReturnPredicate() {
    return true;
  }

}

class OrGroupData {
  discreetProperties: Set<string>;
  properties: Properties;
  groupLabel: string;

  constructor(properties: Properties, label: string) {
    this.properties = properties;
    this.discreetProperties = new Set<string>();
    this.groupLabel = label;
  }

  addProperty(property: string) {
    if(this.properties[property].type == "discreet") {
      this.discreetProperties.add(property);
    }
  }

  predicate(item: CdkDrag<any>) {
    //only allow in group if there is not already an item with this property in the group
    return !this.discreetProperties.has(item.data.property);
  }
}

interface Properties {
  [property: string]: PropertyData
}

abstract class PropertyData {
  type: string;
  label: string;
  constructor(type: string, label: string) {
    this.type = type;
  }
}

class DiscreetPropertyData extends PropertyData {
  //can only have one of each
  include: boolean
  exclude: boolean

  constructor(label: string) {
    super("discreet", label);
    this.include = false;
    this.exclude = false;
  }
}

class RangePropertyData extends PropertyData {
  type: "range"

  constructor(label: string) {
    super("range", label);
  }
}