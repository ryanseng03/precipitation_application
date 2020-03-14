import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from "./components/map/map.component"

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

import { HttpClientModule } from '@angular/common/http';
import { TimeRangeSliderComponent } from './components/controls/time-range-slider/time-range-slider.component';
import { OpacitySliderComponent } from './components/controls/opacity-slider/opacity-slider.component';
import { PlayButtonComponent } from './components/controls/generics/play-button/play-button.component';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { SliderComponent } from './components/controls/generics/slider/slider.component';
import { RangeSliderComponent } from './components/controls/generics/range-slider/range-slider.component';
import { VisComponent } from './components/vis/vis.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    TimeRangeSliderComponent,
    OpacitySliderComponent,
    PlayButtonComponent,
    SliderComponent,
    RangeSliderComponent,
    VisComponent,
    ControlPanelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LeafletModule.forRoot(),
    LeafletDrawModule.forRoot(),
    HttpClientModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
