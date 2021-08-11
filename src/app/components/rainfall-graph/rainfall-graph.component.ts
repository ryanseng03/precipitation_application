import { Component, OnInit, Input } from '@angular/core';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteValue, SiteInfo } from 'src/app/models/SiteMetadata';
import { FormControl } from '@angular/forms';
import Moment  from 'moment';
import { Dataset } from 'src/app/models/Dataset';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {
  loading: boolean = false;

  @Input() set width(width: number) {
    let minWidth = 600;
    let h2wRat = 5/9;
    let w = Math.max(minWidth, width);
    let h = w * h2wRat;
    this.graph.layout.height = h;
    this.graph.layout.width = w;
  }

  __selected: SiteInfo = null;

  @Input() set selected(station: SiteInfo) {
    if(station) {
      this.loading = true;
      this.graph.data[0].x = [];
      this.graph.data[0].y = [];
      this.value = null;
    }
    console.log(station);
    this.__selected = station;
  }


  //date indexing here, might want to change this a bit
  dates: Moment.Moment[];
  values: number[];



  @Input() set data(data: SiteValue[]) {
    //the set range should be determined by the dataset, hardcode for now


    if(data) {
      this.value = data;

      //range of dates for data set, this should be updated when data set changes
      //hardcode for now
      let dateRange = [Moment("1991-01-01"), Moment("2019-12-31")];
      

      //need to map dates from total min and max, global min is beginning of year, global max is current date, rest can be taken as subsets
      //total range
      
      this.dates = this.dateHandler.expandDates(dateRange[0], dateRange[1], "day");

      //map date strings to moments
      //note the date field will probably be replaced with moments once settled
      let valueDates = data.map((value: SiteValue) => {
        return Moment(value.date);
      });

      //initialize values array with nulls
      this.values = new Array(this.dates.length).fill(null);
      //set values based on indexed dates from value docs
      for(let item of data) {
        let date = Moment(item.date);
        let index = this.getDateIndex(date, "day");
        this.values[index] = item.value;
      }

      //set station value range slice
      let valueMin = Moment.min(valueDates);
      let valueMax = Moment.max(valueDates);
      let slice = this.getSliceRange(valueMin, valueMax, "day");
      this.rangeOpts[this.rangeOpts.length - 1].dateSlice = slice;
      //set focused slices
      this.createFocusSlices();
      //update the graph and unset loading flag
      this.updateGraph();
      this.loading = false;
    }
  }

  __date: Moment.Moment = null;
  @Input() set date(date: Moment.Moment) {
    this.__date = date;
    //only if dates have been initialized
    if(this.dates) {
      //update the date slices and graph when focus date changes
      this.createFocusSlices();
      this.updateGraph();
    }
  }


  //DATASET SHOULD HAVE ASSOCIATED TIME SERIES GRANULARITIES
  //FOR NOW HARDCODE AS DAILY


  //dates
  //dates = {};
 

  // //needs day time series goes to, should switch dates in dataset to be full (down to second), have
  // @Input() set range(range: [Moment.Moment, Moment.Moment]) {
  //   let rangeGen: Moment.Moment;
  //   for(let period of this.seriesPeriods) {
  //     let format = this.period2Format(period);
  //     rangeGen = Moment(range[0]);
  //     this.dates[period] = [];
  //     while(rangeGen.isBefore(range[1])) {
  //       rangeGen.add(1, period);
  //       let date = rangeGen.format(format);
  //       this.dates[period].push(date);
  //     }
  //   }

  //   let lowestPeriod = "day";

  //   //let rangeGen = Moment(range[0]);
  //   //use do while, want to capture the next group (if doing something like 5 year may surpass end)
  //   do {
  //     rangeGen.add(1, "day");
  //     rangeGen.month();
  //   }
  //   while(rangeGen.isBefore(range[1]))
  //   this.graph.data[0].y = new Array().fill(null);
  // }

  @Input() minDatePeriod: "second" | "minute" | "hour" | "day" | "month" | "year";

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


  createFocusSlices(): void {
    //exclude last entry for full range
    for(let i = 0; i < this.rangeOpts.length - 1; i++) {
      let rangePeriod: Moment.unitOfTime.StartOf = <Moment.unitOfTime.StartOf>this.rangeOpts[i].period;

      //STARTOF AND ENDOF METHODS MUTATE MOMENT AND RETURNS ITSELF
      //why? moment.js is so frustrating sometimes
      //I'm all for mutability, but sometimes it just doesn't make sense...

      //min date max of beginning of focused year or set min
      let minDate = this.__date.clone().startOf(rangePeriod);
      minDate = Moment.max(minDate, this.dates[0]);

      //max date min of end of focused year or set range
      let maxDate = this.__date.clone().endOf(rangePeriod);
      maxDate = Moment.min([maxDate, this.dates[this.dates.length - 1]]);

      //note day period temp, also need to implement monthly graphs
      //use var for extensibility
      let period: Moment.unitOfTime.Diff = "day";
      let sliceRange = this.getSliceRange(minDate, maxDate, period);
      this.rangeOpts[i].dateSlice = sliceRange;
    }
  }

  getSliceRange(start: Moment.Moment, end: Moment.Moment, period: Moment.unitOfTime.Diff): [number, number] {
    //start index based on period defference from range min to month min
    let startIndex = this.getDateIndex(start, period);
    //add one since will return index of last element, slice exclusive on right
    let endIndex = this.getDateIndex(end, period) + 1;

    return [startIndex, endIndex];
  }

  getDateIndex(date: Moment.Moment, period: Moment.unitOfTime.Diff): number {
    let rangeMin = this.dates[0];
    let dateIndex = date.diff(rangeMin, period);
    return dateIndex;
  }




  value: SiteValue[] = null;

  constructor(private paramService: EventParamRegistrarService, private dateHandler: DateManagerService) {
    this.control.valueChanges.subscribe((value: string) => {
      this.updateGraph();
    });

    // paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset, (dataset: Dataset) => {
    //   console.log(dataset);
    // });
  }

  updateGraph() {
    if(this.value != null) {
      this.graph.layout.title = `Station ${this.__selected.skn}`;
      let index = this.control.value;
      this.graph.data[0].y = this.values.slice(...this.rangeOpts[index].dateSlice);
      //can make this more efficient by storing array of strings
      this.graph.data[0].x = this.dates.slice(...this.rangeOpts[index].dateSlice).map((item) => item.format("YYYY-MM-DD"));
      let nullI = this.graph.data[0].y.indexOf(null);
      console.log(this.graph.data[0].x[nullI])
    }

  }

  ngOnInit() {
  }




}
