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
import { DateFocusComponent } from './components/controls/date-focus/date-focus.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import { DatasetInfoComponent } from './components/controls/dataset-info/dataset-info.component';

import { AngularResizedEventModule } from 'angular-resize-event';
import { ExportComponent } from './components/export/export.component';
import { DataViewsComponent } from './components/data-views/data-views.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { SelectAutocompleteModule } from 'mat-select-autocomplete';
import { FilterPipe } from './pipes/filter.pipe';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';


import { NavbarComponent } from './components/navbar/navbar.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MapControlsComponent } from './components/map-controls/map-controls.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { RainfallGraphComponent } from './components/rainfall-graph/rainfall-graph.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { LeafletOpacitySliderComponent } from './components/leaflet-controls/leaflet-opacity-slider/leaflet-opacity-slider.component';
import { LeafletColorScaleComponent } from './components/leaflet-controls/leaflet-color-scale/leaflet-color-scale.component';

import {MatDialogModule} from '@angular/material/dialog';
import { ExportUnimplementedComponent } from './dialogs/export-unimplemented/export-unimplemented.component';
import { UploadCustomColorSchemeComponent } from './dialogs/upload-custom-color-scheme/upload-custom-color-scheme.component';
import { ExportAddItemComponent } from './dialogs/export-add-item/export-add-item.component';
import { ExportInterfaceComponent } from './components/export-interface/export-interface.component';
import { FilterMapComponent } from './components/filter-map/filter-map.component';
import { NavBaseComponent } from './components/nav-base/nav-base.component';
import { NavTilesComponent } from './components/nav-tiles/nav-tiles.component';
import { LeafletCompassRoseComponent } from './components/leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';
import { StationFilterInterfaceComponent } from './components/station-filter-interface/station-filter-interface.component';
import { StationPropertyFiltersComponent } from './components/station-property-filters/station-property-filters.component';

import {DragDropModule} from '@angular/cdk/drag-drop';
import { HeaderControlComponent } from './components/leaflet-controls/header-control/header-control.component';

PlotlyModule.plotlyjs = PlotlyJS;

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
    DateFocusComponent,
    DatasetInfoComponent,
    ExportComponent,
    DataViewsComponent,
    FilterPipe,
    NavbarComponent,
    MapControlsComponent,
    RainfallGraphComponent,
    LeafletOpacitySliderComponent,
    LeafletColorScaleComponent,
    ExportUnimplementedComponent,
    UploadCustomColorSchemeComponent,
    ExportAddItemComponent,
    ExportInterfaceComponent,
    FilterMapComponent,
    NavBaseComponent,
    NavTilesComponent,
    LeafletCompassRoseComponent,
    StationFilterInterfaceComponent,
    StationPropertyFiltersComponent,
    HeaderControlComponent
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
    MatListModule,
    MatTooltipModule,
    AngularResizedEventModule,
    MatAutocompleteModule,
    SelectAutocompleteModule,
    MatMenuModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    PlotlyModule,
    MatDialogModule,
    DragDropModule
  ],
  entryComponents: [
    ExportUnimplementedComponent,
    UploadCustomColorSchemeComponent,
    ExportAddItemComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
