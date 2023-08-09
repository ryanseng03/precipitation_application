import { Component, OnInit, Input } from '@angular/core';
import Moment from 'moment';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';
import { Observable } from 'rxjs';
import { MapLocation, Station, V_Station } from 'src/app/models/Stations';
import { UnitOfTime } from 'src/app/services/dataset-form-manager.service';
import { CsvGenService } from 'src/app/services/export/csv-gen.service';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {
  loading: boolean = false;
  data: any = {};

  yaxisText: string;

  w = 900;
  h = 500;

  rangeData = {
    periodRanges: {
      day: ["month", "year", "all"],
      month: ["year", "all"]
    },
    buttonData: {
      month: "Zoom to month",
      year: "Zoom to year",
      all: "Zoom to all data"
    },
    ranges: {
      month: null,
      year: null,
      all: null
    }
  };

  periodLabelMap = {
    day: "Daily",
    month: "Monthly"
  }

  zoomData: any = {}

  @Input() set width(width: number) {
    let minWidth = 600;
    let h2wRat = 5/9;
    this.w = Math.max(minWidth, width);
    this.h = this.w * h2wRat;
    for(let period in this.data) {
      let graph = this.data[period].graph;
      graph.layout.height = this.h;
      graph.layout.width = this.w;
    }
  }

  @Input() set axisLabel(axisLabel: string) {
    this.yaxisText = axisLabel;
  }

  _location: MapLocation = null;
  @Input() set location(location: MapLocation) {
    if(location && this._location && !location.equal(this._location)) {
      //reset data
      this.data = {};
    }
    this._location = location;
  }

  @Input() complete: boolean;

  @Input() source: Observable<TimeseriesGraphData>;


  __date: Moment.Moment = null;
  @Input() set date(date: Moment.Moment) {
    this.__date = date;
    let clone = date.clone();
    //just get current month, and year
    //if subdaily data available need to swap this to get lowest available period as well and get all higher level periods
    let monthRange = [clone.startOf("month").toISOString(), clone.endOf("month").toISOString()];
    let yearRange = [clone.startOf("year").toISOString(), clone.endOf("year").toISOString()]
    this.rangeData.ranges.month = monthRange;
    this.rangeData.ranges.year = yearRange;
    //set ranges for all graphs with zooms applied
    for(let period in this.zoomData) {
      //if there is data for the period apply zoom
      if(this.data[period]) {
        this.setRange(period, this.zoomData[period]);
      }
    }
  }


  setRange(dataPeriod: string, rangePeriod: string) {
    //log zoom applied
    this.zoomData[dataPeriod] = rangePeriod;
    this.data[dataPeriod].graph.layout.xaxis = {
      range: this.rangeData.ranges[rangePeriod],
      title: {
        text: "Date",
      }
    };
    this.data[dataPeriod].graph.layout.yaxis = {
      autorange: true,
      title: {
        text: this.yaxisText,
      }
    };
  }


  constructor(private dateHandler: DateManagerService, private csvGen: CsvGenService) {

  }

  downloadCSV(period: string) {
    let dates = this.data[period].graph.data[0].x;
    let values = this.data[period].graph.data[0].y;
    let data = [["date", "value"]];
    //zip dates and values into data
    for(let i = 0; i < dates.length; i++) {
      data.push([dates[i], values[i]]);
    }
    let fname = `${period}_timeseries.csv`;
    if(this._location.type == "station") {
      let station = <Station>this._location;
      fname = `station_${station.id}_${fname}`;
    }
    else if(this._location.type == "virtual_station") {
      let virtualStation = <V_Station>this._location;
      fname = `virtual_station_${virtualStation.location.lat}_${virtualStation.location.lng}_${fname}`;
    }
    this.csvGen.createCSV(data, fname);
  }

  ngOnInit() {
    this.source.subscribe((data: TimeseriesGraphData) => {
      //deconstruct data
      const { period, location, values } = data;
      //ignore if different location (probably old data)
      if(location.equal(this._location)) {
        let periodData = this.data[period];
        if(periodData === undefined) {
          let title = `${this._location.format.getFieldFormat("name")?.formattedValue || "Virtual Station"} ${this.periodLabelMap[period]} Data`;
          periodData = {
            dates: [],
            graph: {
              data: [
                  {
                    x: [],
                    y: [],
                    type: "scatter",
                    mode: "lines",
                    connectgaps: false,
                    marker: {
                      color: "blue"
                    }
                  }
              ],
              layout: {
                width: this.w,
                height: this.h,
                title,
                xaxis: {
                  title: {
                    text: "Date",
                  },
                },
                yaxis: {
                  autorange: true,
                  title: {
                    text: this.yaxisText,
                  }
                }
              }
            }
          }
          this.data[period] = periodData;
          this.setRange(period, this.zoomData[period]);
        }

        let chunkStartDate = null;
        let chunkEndDate = null;
        for(let item of values) {
          //deconstruct item
          let date = item.date;
          if(chunkStartDate === null) {
            chunkStartDate = date;
            chunkEndDate = date;
          }
          else {
            if(date.isBefore(chunkStartDate)) {
              chunkStartDate = date;
            }
            else if(date.isAfter(chunkEndDate)) {
              chunkEndDate = date;
            }
          }
        }

        let startDate = null;
        let endDate = null;
        if(periodData.dates.length > 0) {
          startDate = periodData.dates[0];
          endDate = periodData.dates[periodData.dates.length - 1];
          if(chunkStartDate.isBefore(startDate)) {
            let newDates = this.dateHandler.expandDates(chunkStartDate, startDate, period);
            //strip the last value (current start date)
            newDates.pop();
            //create date strings
            let newDateStrings = newDates.map((date: Moment.Moment) => {
              return this.dateHandler.dateToString(date, period);
            });
            //create values to add, fill with null (note setting current date values will be handled in next part)
            let newValues = new Array(newDates.length).fill(null);

            //add new dates to start of date arrays
            periodData.dates = newDates.concat(periodData.dates);
            periodData.graph.data[0].x = newDateStrings.concat(periodData.graph.data[0].x);
            //extend values array
            periodData.graph.data[0].y = newValues.concat(periodData.graph.data[0].y);
            startDate = chunkStartDate;
          }
          if(chunkEndDate.isAfter(endDate)) {
            //create dates to add
            let newDates = this.dateHandler.expandDates(endDate, chunkEndDate, period);
            //strip the first value (current end date)
            newDates.shift();
            //create date strings
            let newDateStrings = newDates.map((date: Moment.Moment) => {
              return this.dateHandler.dateToString(date, period);
            });
            //create values to add, fill with null (note setting current date values will be handled in next part)
            let newValues = new Array(newDates.length).fill(null);

            //add new dates to end of date arrays
            periodData.dates = periodData.dates.concat(newDates);
            periodData.graph.data[0].x = periodData.graph.data[0].x.concat(newDateStrings);
            //extend values array
            periodData.graph.data[0].y = periodData.graph.data[0].y.concat(newValues);
            endDate = chunkEndDate;
          }
        }
        else {
          startDate = chunkStartDate;
          endDate = chunkEndDate;
          let newDates = this.dateHandler.expandDates(chunkStartDate, chunkEndDate, period);
          let newDateStrings = newDates.map((date: Moment.Moment) => {
            return this.dateHandler.dateToString(date, period);
          });
          //create values to add, fill with null (note setting current date values will be handled in next part)
          let newValues = new Array(newDates.length).fill(null);
          //add new dates to start of date arrays
          periodData.dates = newDates;
          periodData.graph.data[0].x = newDateStrings;
          //extend values array
          periodData.graph.data[0].y = newValues;
        }

        //set values
        for(let item of values) {
          //deconstruct item
          const {value, date} = item;
          //get date index based on period offset from startDate
          let index = (<Moment.Moment>date).diff(startDate, period, false);
          periodData.graph.data[0].y[index] = value;
        }

        //trigger graph data to update by copying data object
        periodData.graph.data = JSON.parse(JSON.stringify(periodData.graph.data));
      }
    });
  }
}


export interface TimeseriesGraphData {
  location: MapLocation,
  //should make this more specific
  period: UnitOfTime,
  values: TimeseriesGraphDataPoint[]
}

export interface TimeseriesGraphDataPoint {
  value: number,
  date: Moment.Moment
}