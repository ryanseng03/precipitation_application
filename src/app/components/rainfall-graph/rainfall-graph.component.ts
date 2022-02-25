import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteValue, SiteInfo } from 'src/app/models/SiteMetadata';
import { FormControl } from '@angular/forms';
import Moment  from 'moment';
import { Dataset } from 'src/app/models/Dataset';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {
  loading: boolean = false;
  data: any = {};

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
      all: "All station data"
    },
    ranges: {
      month: null,
      year: null,
      all: null
    }
  };

  periodLableMap = {
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

  __station: any = null;
  @Input() set station(station: SiteInfo) {
    if(station) {
      //reset data
      this.data = {};
    }
    this.__station = station;
  }

  @Input() complete;

  @Input() source: Observable<any>;


  __date: Moment.Moment = null;
  @Input() set date(date: Moment.Moment) {
    this.__date = date;
    //just get current month, and year
    //if subdaily data available need to swap this to get lowest available period as well and get all higher level periods
    let monthRange = [date.startOf("month").toISOString(), date.endOf("month").toISOString()];
    let yearRange = [date.startOf("year").toISOString(), date.endOf("year").toISOString()]
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
    }
  }


  constructor(private dateHandler: DateManagerService, private cd: ChangeDetectorRef) {

  }



  ngOnInit() {
    this.source.subscribe((data: any) => {
      //deconstruct data
      const { period, stationId, values } = data;
      //ignore if station id is wrong
      if(stationId == this.__station.skn) {
        let periodData = this.data[period];
        if(periodData === undefined) {
          periodData = {
            dates: [],
            graph: {
              data: [
                  {
                    x: [],
                    y: [],
                    type: "scatter",
                    mode: "lines+points",
                    connectgaps: false,
                    marker: {
                      color: "blue"
                    }
                  }
              ],
              layout: {
                width: this.w,
                height: this.h,
                title: `${this.__station.name} ${this.periodLableMap[period]} Data`,
                xaxis: {
                  title: {
                    text: "Date",
                  },
                },
                yaxis: {
                  title: {
                    text: "Rainfall (mm)",
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
            let newDateStrings = newDates.map((date: Moment.Moment) => {
              return this.dateHandler.dateToString(date, period);
            });
            //strip the last value (current start date)
            newDates.pop();
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
            let newDateStrings = newDates.map((date: Moment.Moment) => {
              return this.dateHandler.dateToString(date, period);
            });
            //strip the first value (current end date)
            newDates.shift();
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
          //strip the last value (current start date)
          newDates.pop();
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
      }
    });
  }




}
