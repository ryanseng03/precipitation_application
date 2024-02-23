import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from "./components/map/map.component"

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

import { HttpClientModule } from '@angular/common/http';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { SliderComponent } from './components/controls/generics/slider/slider.component';
import { RangeSliderComponent } from './components/controls/generics/range-slider/range-slider.component';
import { VisComponent } from './components/vis/vis.component';

import {MatDatepickerModule} from '@angular/material/datepicker';
import { DateSelectorComponent } from './components/controls/date-selector/date-selector.component';
import {MatInputModule} from "@angular/material/input";
import {MatMomentDateModule} from "@angular/material-moment-adapter";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MatSliderModule } from '@angular/material/slider';
import { RfSiteDetailsComponent } from './components/rf-site-details/rf-site-details.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from "@angular/material/select";
import { SiteDataTableComponent } from './components/controls/site-data-table/site-data-table.component';
import { SiteAvailabilityTableComponent } from './components/controls/site-availability-table/site-availability-table.component';
import { DataSetFormComponent } from './components/data-set-form/data-set-form.component'
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { DateFocusComponent } from './components/controls/date-focus/date-focus.component';
import {MatTooltipModule} from '@angular/material/tooltip';

import { AngularResizedEventModule } from 'angular-resize-event';
import { DataViewsComponent } from './components/data-views/data-views.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { SelectAutocompleteModule } from 'mat-select-autocomplete';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';


import { NavbarComponent } from './components/navbar/navbar.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { RainfallGraphComponent } from './components/rainfall-graph/rainfall-graph.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { LeafletColorScaleComponent } from './components/leaflet-controls/leaflet-color-scale/leaflet-color-scale.component';

import {MatDialogModule} from '@angular/material/dialog';
import { ExportUnimplementedComponent } from './dialogs/export-unimplemented/export-unimplemented.component';
import { UploadCustomColorSchemeComponent } from './dialogs/upload-custom-color-scheme/upload-custom-color-scheme.component';
import { ExportAddItemComponent } from './dialogs/export-add-item/export-add-item.component';
import { ExportInterfaceComponent } from './components/export-interface/export-interface.component';
import { NavBaseComponent } from './components/nav-base/nav-base.component';
import { NavTilesComponent } from './components/nav-tiles/nav-tiles.component';
import { LeafletCompassRoseComponent } from './components/leaflet-controls/leaflet-compass-rose/leaflet-compass-rose.component';

import {DragDropModule} from '@angular/cdk/drag-drop';
import { HeaderControlComponent } from './components/leaflet-controls/header-control/header-control.component';
import { ViewContainerComponent } from './components/view-container/view-container.component';
import { LoadingComponentComponent } from './components/loading-component/loading-component.component';
import { TimeSeriesComponent } from './components/time-series/time-series.component';
import { LeafletLayerControlExtensionComponent } from './components/leaflet-controls/leaflet-layer-control-extension/leaflet-layer-control-extension.component';
import { ErrorPopupComponent } from './dialogs/error-popup/error-popup.component';

import {MatProgressBarModule} from '@angular/material/progress-bar';
import { InfoPopupComponent } from './dialogs/info-popup/info-popup.component';
import { LeafletImageExportComponent } from './components/leaflet-controls/leaflet-image-export/leaflet-image-export.component';
import { DateGroupSelectorComponent } from './components/controls/date-group-selector/date-group-selector.component';
import { FocusControlComponent } from './components/controls/focus-control/focus-control.component';
import { StationFilterComponent } from './components/station-filter/station-filter.component';
import { SelectorComponent } from './components/controls/selector/selector.component';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    SliderComponent,
    RangeSliderComponent,
    VisComponent,
    DateSelectorComponent,
    RfSiteDetailsComponent,
    SiteDataTableComponent,
    SiteAvailabilityTableComponent,
    DataSetFormComponent,
    DateFocusComponent,
    DataViewsComponent,
    NavbarComponent,
    RainfallGraphComponent,
    LeafletColorScaleComponent,
    ExportUnimplementedComponent,
    UploadCustomColorSchemeComponent,
    ExportAddItemComponent,
    ExportInterfaceComponent,
    NavBaseComponent,
    NavTilesComponent,
    LeafletCompassRoseComponent,
    HeaderControlComponent,
    ViewContainerComponent,
    LoadingComponentComponent,
    TimeSeriesComponent,
    LeafletLayerControlExtensionComponent,
    ErrorPopupComponent,
    InfoPopupComponent,
    LeafletImageExportComponent,
    DateGroupSelectorComponent,
    FocusControlComponent,
    StationFilterComponent,
    SelectorComponent
  ],
  imports: [
    MatProgressBarModule,
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
    ExportAddItemComponent,
    ErrorPopupComponent,
    InfoPopupComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
