// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as constants from './constants';
import { barchart } from './stableBarChart';
import {
    Chart,
    Insight,
    SpecColumns,
    SpecViewOptions
} from './types';
import { scatterplot } from './scatterPlot';
import { SpecCreator, SpecResult } from './interfaces';
import { treemap } from './treeMap';
import { stacks } from './stacks';

export { constants, barchart as barChart, scatterplot as scatterPlot };

export const creators: { [chart in Chart]: SpecCreator } = {
    barchart,
    scatterplot,
    treemap,
    stacks
}

export function create(insight: Insight, specColumns: SpecColumns, specViewOptions: SpecViewOptions): SpecResult {
    const creator = creators[insight.chart];
    if (creator) {
        const specResult = creator(insight, specColumns, specViewOptions);

        //TODO: find why Vega is doing this. fixup for facets
        if (specResult.vegaSpec && insight.columns && insight.columns.facet && insight.facets.columns === 2 && insight.facets.rows === 1) {
            specResult.vegaSpec.width = insight.size.width / 3;
        }

        return specResult;
    }
}
