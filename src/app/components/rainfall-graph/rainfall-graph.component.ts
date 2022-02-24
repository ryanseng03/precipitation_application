import { Component, OnInit, Input } from '@angular/core';
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
  private data: any = {};

  @Input() set width(width: number) {
    let minWidth = 600;
    let h2wRat = 5/9;
    let w = Math.max(minWidth, width);
    let h = w * h2wRat;
    this.graph.layout.height = h;
    this.graph.layout.width = w;
  }

  __station: any = null;

  @Input() set station(station: SiteInfo) {
    if(station) {
      //reset data
      this.data = {};
    }
    this.__station = station;
  }

  @Input() set complete(complete: boolean) {
    let nullIndex = this.graph.data[0].y.findIndex((value) => value === null);
    console.log(nullIndex);
    console.log(this.graph.data[0].x[nullIndex]);
  }

  @Input() source: Observable<any>;

  // @Input() set ssource(source: Observable<any>) {


  //   //the set range should be determined by the dataset, hardcode for now


  //   if(data) {
  //     this.value = data;

  //     //range of dates for data set, this should be updated when data set changes
  //     //hardcode for now
  //     let dateRange = [Moment("1991-01-01"), Moment("2019-12-31")];


  //     //need to map dates from total min and max, global min is beginning of year, global max is current date, rest can be taken as subsets
  //     //total range

  //     this.dates = this.dateHandler.expandDates(dateRange[0], dateRange[1], "day");

  //     //map date strings to moments
  //     //note the date field will probably be replaced with moments once settled
  //     let valueDates = data.map((value: SiteValue) => {
  //       return Moment(value.date);
  //     });

  //     //initialize values array with nulls
  //     this.values = new Array(this.dates.length).fill(null);
  //     //set values based on indexed dates from value docs
  //     for(let item of data) {
  //       let date = Moment(item.date);
  //       let index = this.getDateIndex(date, "day");
  //       this.values[index] = item.value;
  //     }

  //     //set station value range slice
  //     let valueMin = Moment.min(valueDates);
  //     let valueMax = Moment.max(valueDates);
  //     let slice = this.getSliceRange(valueMin, valueMax, "day");
  //     this.rangeOpts[this.rangeOpts.length - 1].dateSlice = slice;
  //     //set focused slices
  //     this.createFocusSlices();
  //     //update the graph and unset loading flag
  //     this.updateGraph();
  //     this.loading = false;
  //   }
  // }

  __date: Moment.Moment = null;
  @Input() set date(date: Moment.Moment) {
    this.__date = date;
    // //only if dates have been initialized
    // if(this.dates) {
    //   //update the date slices and graph when focus date changes
    //   this.createFocusSlices();
    //   this.updateGraph();
    // }
  }



  config = {
    responsive: true
  }

  public graph = {
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
      width: 900,
      height: 500,
      title: "",
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
  };

  control = new FormControl(0);

  //remember to swtich this to multiple periods

  //need to add gaps in data when no data
  //have x axis pre-populated with dates (change when focused date changes)
  public rangeOpts = [{
    period: "month",
    display: "Current Month",
    dateSlice: [],
    value: 0
  },
  {
    period: "year",
    display: "Current Year",
    dateSlice: [],
    value: 1
  },
  {
    display: "All Values",
    dateSlice: [],
    value: 2
  }];


  // createFocusSlices(): void {
  //   //exclude last entry for full range
  //   for(let i = 0; i < this.rangeOpts.length - 1; i++) {
  //     let rangePeriod: Moment.unitOfTime.StartOf = <Moment.unitOfTime.StartOf>this.rangeOpts[i].period;

  //     //STARTOF AND ENDOF METHODS MUTATE MOMENT AND RETURNS ITSELF
  //     //why? moment.js is so frustrating sometimes
  //     //I'm all for mutability, but sometimes it just doesn't make sense...

  //     //min date max of beginning of focused year or set min
  //     let minDate = this.__date.clone().startOf(rangePeriod);
  //     minDate = Moment.max(minDate, this.dates[0]);

  //     //max date min of end of focused year or set range
  //     let maxDate = this.__date.clone().endOf(rangePeriod);
  //     maxDate = Moment.min([maxDate, this.dates[this.dates.length - 1]]);

  //     //note day period temp, also need to implement monthly graphs
  //     //use var for extensibility
  //     let period: Moment.unitOfTime.Diff = "day";
  //     let sliceRange = this.getSliceRange(minDate, maxDate, period);
  //     this.rangeOpts[i].dateSlice = sliceRange;
  //   }
  // }

  // getSliceRange(start: Moment.Moment, end: Moment.Moment, period: Moment.unitOfTime.Diff): [number, number] {
  //   //start index based on period defference from range min to month min
  //   let startIndex = this.getDateIndex(start, period);
  //   //add one since will return index of last element, slice exclusive on right
  //   let endIndex = this.getDateIndex(end, period) + 1;

  //   return [startIndex, endIndex];
  // }

  // getDateIndex(date: Moment.Moment, period: Moment.unitOfTime.Diff): number {
  //   let rangeMin = this.dates[0];
  //   let dateIndex = date.diff(rangeMin, period);
  //   return dateIndex;
  // }




  // value: SiteValue[] = null;

  constructor(private paramService: EventParamRegistrarService, private dateHandler: DateManagerService) {
    // this.control.valueChanges.subscribe((value: string) => {
    //   this.updateGraph();
    // });
  }

  // updateGraph() {
  //   if(this.value != null) {
  //     this.graph.layout.title = `Station ${this.__selected.skn}`;
  //     let index = this.control.value;
  //     this.graph.data[0].y = this.values.slice(...this.rangeOpts[index].dateSlice);
  //     //can make this more efficient by storing array of strings
  //     this.graph.data[0].x = this.dates.slice(...this.rangeOpts[index].dateSlice).map((item) => item.format("YYYY-MM-DD"));
  //     let nullI = this.graph.data[0].y.indexOf(null);
  //     console.log(this.graph.data[0].x[nullI])
  //   }

  // }

  ngOnInit() {
    this.source.subscribe((data: any) => {
      console.log(data);
      //deconstruct data
      const { period, stationId, values } = data;
      //ignore if station id is wrong
      if(stationId == this.__station.skn) {
        let periodData = this.data[period];
        if(periodData === undefined) {
          periodData = {
            dates: [],
            dateStrings: [],
            values: []
          }
          this.data[period] = periodData;
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
            periodData.dateStrings = newDateStrings.concat(periodData.dateStrings);
            //extend values array
            periodData.values = newValues.concat(periodData.values);
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
            periodData.dateStrings = periodData.dateStrings.concat(newDateStrings);
            //extend values array
            periodData.values = periodData.values.concat(newValues);
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
          periodData.dateStrings = newDateStrings;
          //extend values array
          periodData.values = newValues;
        }



        //set values
        for(let item of values) {
          //deconstruct item
          const {value, date} = item;
          //get date index based on period offset from startDate
          let index = (<Moment.Moment>date).diff(startDate, period, false);
          periodData.values[index] = value;
        }

        console.log(periodData);

        //TEMP
        this.graph.data[0].x = periodData.dateStrings;
        this.graph.data[0].y = periodData.values;



      }
    });
  }




}
