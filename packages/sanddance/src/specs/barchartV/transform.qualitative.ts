// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { FieldNames } from '../constants';
import { SpecColumns } from '../types';
import { StackTransform, Transforms } from 'vega-typings';
import { xtent } from './constants';

export default function (columns: SpecColumns) {
    const stackTransform: StackTransform = {
        "type": "stack",
        "groupby": [
            {
                "field": columns.x.name
            }
        ],
        "as": [
            FieldNames.BarChartStack0,
            FieldNames.BarChartStack1
        ]
    };
    if (columns.sort) {
        stackTransform.sort = {
            "field": columns.sort.name
        };
    }
    const transforms: Transforms[] = [
        stackTransform,
        {
            "type": "extent",
            "signal": xtent,
            "field": FieldNames.BarChartStack1
        }
    ];

    return transforms;
}