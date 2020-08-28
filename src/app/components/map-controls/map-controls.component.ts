import { Component, OnInit, Input } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { FormControl } from '@angular/forms';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.scss']
})
export class MapControlsComponent implements OnInit {

  @Input() map: MapComponent;

  schemeControl: FormControl = new FormControl("mono");

  constructor() { }

  ngOnInit() {
    this.schemeControl.valueChanges.subscribe((scheme: string) => {
      this.map.setColorScheme(scheme);
    });
    // this.opacityControl.valueChanges.subscribe((opacity: number) => {
    //   console.log(opacity);
    //   this.map.setOpacity(opacity);
    // });
  }

  setOpacity(event: MatSliderChange) {
    this.map.setOpacity(event.value);
  }

}
