import {Dataset} from "./dataset"

export interface DatasetConfig {
    initialSetIndex: number,
    datasets: any[]
}

let config: any = {
    initialSetIndex: 0,
    //categorized by type
    datasets: {
        rainfall: [{
            range: {
                start: "1990-01-01",
                end: "2019-12-31"
            },
            timesteps: ["monthly"],
            methods: ["new"],
            timestepsAvailable: ["monthly", "daily"],
            fillTypes: ["filled", "partial", "unfilled"]
        }]
    }
}

let selectors = [];

//generate discreet sets
for(let dataset of config.datasets) {
    let base = {

    }
}

function getDatasets(): string[] {
    return 
}