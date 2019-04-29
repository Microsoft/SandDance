// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { fill } from '../fill';
import { Mark } from 'vega-typings';
import { SpecColumns, SpecViewOptions } from '../types';

export default function (columns: SpecColumns, specViewOptions: SpecViewOptions) {
    const marks: Mark[] = [
        {
            "name": "marks2",
            "type": "rect",
            "from": {
                "data": "stackedgroup"
            },
            "encode": {
                "update": {
                    "x": {
                        "scale": "xband",
                        "field": columns.x.quantitative ? "long0" : columns.x.name,
                        "offset": {
                            "scale": "xinternalscale",
                            "field": "column"
                        }
                    },
                    "y": {
                        "scale": "yband",
                        "field": columns.y.quantitative ? "lat0" : columns.y.name,
                        "offset": {
                            "scale": "yinternalscale",
                            "field": "depth"
                        }
                    },
                    "z": {
                        "scale": "zband",
                        "field": "row"
                    },
                    "depth": {
                        "scale": "zband",
                        "band": true
                    },
                    "width": {
                        "signal": "actsize"
                    },
                    "opacity": {
                        "value": 0.1
                    },
                    "height": {
                        "signal": "actsize"
                    },
                    "fill": fill(columns.color, specViewOptions)
                }
            }
        }
    ];
    return marks;
}
