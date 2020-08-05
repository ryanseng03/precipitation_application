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

import {MatDatepickerModule} from '@angular/material/datepicker';
import { DateSelectorComponent } from './components/controls/date-selector/date-selector.component';
import {MatInputModule} from "@angular/material/input";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MatSliderModule } from '@angular/material/slider';
import { DataSetSelectorComponent } from './components/controls/data-set-selector/data-set-selector.component';
import { DataSetIntervalSelectorComponent } from './components/controls/data-set-interval-selector/data-set-interval-selector.component';
import { RfSiteDetailsComponent } from './components/rf-site-details/rf-site-details.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from "@angular/material/select";
import { DisplayValuePipe } from './pipes/display-value.pipe';
import { SiteFilterComponent } from './components/controls/site-filter/site-filter.component';
import { SiteSearchComponent } from './components/controls/site-search/site-search.component';
import { SiteDataTableComponent } from './components/controls/site-data-table/site-data-table.component';
import { SiteAvailabilityTableComponent } from './components/controls/site-availability-table/site-availability-table.component';
import { DataSetFormComponent } from './components/data-set-form/data-set-form.component'
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { DataInfoComponent } from './components/data-info/data-info.component';
import { DateFocusComponent } from './components/controls/date-focus/date-focus.component';

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
    ControlPanelComponent,
    DateSelectorComponent,
    DataSetSelectorComponent,
    DataSetIntervalSelectorComponent,
    RfSiteDetailsComponent,
    DisplayValuePipe,
    SiteFilterComponent,
    SiteSearchComponent,
    SiteDataTableComponent,
    SiteAvailabilityTableComponent,
    DataSetFormComponent,
    DataInfoComponent,
    DateFocusComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    LeafletModule.forRoot(),
    LeafletDrawModule.forRoot(),
    HttpClientModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatMomentDateModule,
    BrowserAnimationsModule,
    MatSliderModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
