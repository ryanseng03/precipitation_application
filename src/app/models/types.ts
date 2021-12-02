import { Moment } from "moment";

export type Period = "second" | "minute" | "hour" | "day" | "month" | "year";

export type StringMap = {[item: string]: string};
//export type SingletTypeMap = {[item: string]: string | number | boolean};

// interface ValueData<T> {
//   tag: string,
//   label: string,
//   description: string,
//   value: T
// }
// //this only needs the actively selected thing, not all the options
// type SelectedData<T> = ValueData<ValueData<T>>;
// //type SelectedMap{[tag: string]: SelectedData<string>};
// type SelectorData<T> = ValueData<{[tag: string]: ValueData<T>}>;
// type SelectorMap = {[tag: string]: SelectorData<string>};

type Dataset = {

}

let data = {

}

type ValueData<T> = {
    id: string,
    label: string,
    descriptor: string,
    value: T
};

type Selector = ValueData<ValueData<Selector>[]>;

type SelectorPathNode = Selector | null
