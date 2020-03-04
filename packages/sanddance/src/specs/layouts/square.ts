// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { addData, addMarks, addSignal } from '../scope';
import { Column } from '../types';
import {
    GroupEncodeEntry,
    RectMark,
    Scope,
    Transforms
} from 'vega-typings';
import { InnerScope } from '../interfaces';
import { Layout, LayoutBuildProps, LayoutProps } from './layout';

export interface SquareProps extends LayoutProps {
    sortBy: Column;
    fillDirection: 'right-down' | 'right-up' | 'down-right';
    maxGroupedUnits?: string;
    maxGroupedFillSize?: string;
}

export class Square extends Layout {
    private names: {
        dataName: string,
        aspect: string,
        bandWidth: string,
        squaresPerBand: string,
        index: string,
        gap: string,
        size: string,
        levels: string,
        levelSize: string,
        facetData: string,
        grouping: string,
        maxGroup: string
    }

    constructor(public props: SquareProps & LayoutBuildProps) {
        super(props);
        const p = this.prefix = `square_${this.id}`;
        this.names = {
            dataName: `data_${p}`,
            aspect: `${p}_aspect`,
            bandWidth: this.getBandWidth(),
            squaresPerBand: `${p}_squares_per_band`,
            index: `${p}_index`,
            gap: `${p}_gap`,
            size: `${p}_size`,
            levels: `${p}_levels`,
            levelSize: `${p}_levelsize`,
            facetData: `facet_${p}`,
            grouping: `data_${p}_grouping`,
            maxGroup: `${p}_max_grouping`
        };
    }

    public build(): InnerScope {
        const { fillDirection, parentScope } = this.props;
        const { names, prefix } = this;
        const mark: RectMark = {
            name: prefix,
            type: 'rect',
            from: {
                data: names.dataName
            },
            encode: {
                update: {
                    ...this.encodeXY(),
                    height: {
                        signal: fillDirection === 'down-right' ? names.size : names.levelSize
                    },
                    width: {
                        signal: fillDirection === 'down-right' ? names.levelSize : names.size
                    }
                }
            }
        };
        addMarks(parentScope.scope, mark);

        let dataName: string
        let scope: Scope;

        this.addData();
        this.addSignals();

        return {
            dataName,
            scope,
            mark,
            sizeSignals: {
                layoutHeight: names.size,
                layoutWidth: names.size
            }
        };
    }

    private getBandWidth() {
        const { sizeSignals } = this.props.parentScope;
        switch (this.props.fillDirection) {
            case 'down-right':
                return sizeSignals.layoutHeight;
            default:
                return sizeSignals.layoutWidth;
        }
    }

    private addData() {
        const { parentScope, sortBy } = this.props;
        const { names } = this;
        const transform: Transforms[] = [
            {
                type: 'window',
                ops: ['row_number'],
                as: [names.index]
            }
        ];
        if (sortBy) {
            transform.unshift({
                type: 'collect',
                sort: { field: sortBy.name }
            });
        }
        addData(parentScope.scope, {
            name: names.dataName,
            source: parentScope.dataName,
            transform
        });
    }

    private addSignals() {
        const { names, props } = this;
        const { fillDirection, globalScope, groupings, parentScope } = props;
        let { maxGroupedFillSize, maxGroupedUnits } = props;

        if (!maxGroupedUnits) {
            if (groupings) {
                addData(globalScope.scope,
                    {
                        name: names.grouping,
                        source: globalScope.dataName,
                        transform: [
                            {
                                type: 'aggregate',
                                groupby: groupings.reduce((acc, val) => acc.concat(val), []),
                                ops: ['count']
                            },
                            {
                                type: 'extent',
                                field: 'count',
                                signal: names.maxGroup
                            }
                        ]
                    }
                );
                maxGroupedUnits = `(${names.maxGroup}[1])`;
            } else {
                maxGroupedUnits = `length(data(${JSON.stringify(globalScope.dataName)}))`;
            }
        }
        if (!maxGroupedFillSize) {
            maxGroupedFillSize = fillDirection === 'down-right' ? parentScope.sizeSignals.layoutWidth : parentScope.sizeSignals.layoutHeight;
        }

        const aspect = `((${names.bandWidth})/(${maxGroupedFillSize}))`;

        addSignal(parentScope.scope,
            {
                name: names.aspect,
                update: aspect || `${globalScope.sizeSignals.layoutWidth}/${props.fillDirection === 'down-right' ? globalScope.sizeSignals.layoutWidth : globalScope.sizeSignals.layoutHeight}`
            },
            {
                name: names.squaresPerBand,
                update: `ceil(sqrt(${maxGroupedUnits}*${names.aspect}))`
            },
            {
                name: names.gap,
                update: `min(0.1*(${names.bandWidth}/(${names.squaresPerBand}-1)),1)`
            },
            {
                name: names.size,
                update: `${names.bandWidth}/${names.squaresPerBand}-${names.gap}`
            },
            {
                name: names.levels,
                update: `ceil(${maxGroupedUnits}/${names.squaresPerBand})`
            },
            {
                name: names.levelSize,
                update: `((${maxGroupedFillSize})/${names.levels})-${names.gap}`
            }
        );
    }

    private encodeXY(): GroupEncodeEntry {
        const { names } = this;
        const compartment = `${names.bandWidth}/${names.squaresPerBand}*((datum[${JSON.stringify(names.index)}]-1)%${names.squaresPerBand})`;
        const level = `floor((datum[${JSON.stringify(names.index)}]-1)/${names.squaresPerBand})`;
        const { fillDirection, parentScope } = this.props;
        switch (fillDirection) {
            case 'down-right': {
                return {
                    x: {
                        signal: `${level}*(${names.levelSize}+${names.gap})`
                    },
                    y: {
                        signal: compartment
                    }
                };
            }
            case 'right-up': {
                return {
                    x: {
                        signal: compartment
                    },
                    y: {
                        signal: `(${parentScope.sizeSignals.layoutHeight})-${names.levelSize}-${level}*(${names.levelSize}+${names.gap})`
                    }
                };
            }
            case 'right-down':
            default: {
                return {
                    x: {
                        signal: compartment
                    },
                    y: {
                        signal: `${level}*(${names.levelSize}+${names.gap})`
                    }
                };
            }
        }
    }
}
