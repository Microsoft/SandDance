// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { binnableColorScale, linearScale, pointScale } from '../scales';
import {
    ScaleNameColor,
    ColorScaleNone,
    DataNames,
    ScaleNameZ,
    FieldNames,
    ZHeightSignal
} from '../constants';
import { Insight, SpecColumns } from '../types';
import { RangeScheme, Scale } from 'vega-typings';

export default function (columns: SpecColumns, insight: Insight) {
    const scales: Scale[] = [];
    if (columns.color) {
        if (columns.color.quantitative) {
            scales.push(binnableColorScale(insight.colorBin, DataNames.Main, columns.color.name, insight.scheme));
        } else {
            scales.push(
                {
                    "name": ScaleNameColor,
                    "type": "ordinal",
                    "domain": {
                        "data": DataNames.Legend,
                        "field": FieldNames.Top,
                        "sort": true
                    },
                    "range": {
                        "scheme": insight.scheme || ColorScaleNone
                    }
                }
            );
        }
    }
    if (columns.z) {
        const zRange: RangeScheme = [0, { "signal": ZHeightSignal }];
        scales.push(
            columns.z.quantitative ?
                linearScale(ScaleNameZ, DataNames.Main, columns.z.name, zRange, false, false)
                :
                pointScale(ScaleNameZ, DataNames.Main, zRange, columns.z.name)
        );
    }
    return scales;
}
