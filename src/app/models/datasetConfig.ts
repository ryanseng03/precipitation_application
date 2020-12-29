import {Dataset} from "./dataset"

export interface DatasetConfig {
    initialSetIndex: number,
    datasets: any[]
}

let config: DatasetConfig = {
    initialSetIndex: 0,
    datasets: [
        {
            general: {
                type: "rainfall",
                range: {
                    start: "1990-01-01",
                    end: "2019-12-31"
                }
            },
            raster: {
                timesteps: ["monthly"],
                methods: ["new"]
            },
            station: {
                //hidden property (no user choice)
                timestepsAvailable: ["monthly", "daily"],
                fillTypes: ["filled", "partial", "unfilled"]
            }
        }
    ]
}