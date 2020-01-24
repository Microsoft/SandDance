// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { binnable } from '../bin';
import { Column } from '../types';
import { createOrdinalsForFacet } from '../ordinal';
import {
    GroupEncodeEntry,
    GroupMark,
    RectMark,
    Scope,
    Transforms
} from 'vega-typings';
import {
    GroupLayoutProps,
    Layout,
    LayoutBuildProps,
    LayoutProps
} from './layout';
import { InnerScope } from '../interfaces';
import { push } from '../../array';

export interface SquareProps extends LayoutProps {
    sortBy: Column;
    fillDirection: 'right-down' | 'right-up' | 'down-right';
    maxGroupedUnits?: string;
    maxGroupedFillSize?: string;
    groupLayoutProps?: GroupLayoutProps;
}

export class Square extends Layout {
    public props: SquareProps & LayoutBuildProps;
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
        facetData: string
    }

    public build(): InnerScope {
        const { props } = this;
        const { fillDirection, groupLayoutProps, parent } = props;
        const prefix = `square_${this.id}`;
        this.names = {
            dataName: `data_${prefix}`,
            aspect: `${prefix}_aspect`,
            bandWidth: this.getBandWidth(),
            squaresPerBand: `${prefix}_squares_per_band`,
            index: `${prefix}_index`,
            gap: `${prefix}_gap`,
            size: `${prefix}_size`,
            levels: `${prefix}_levels`,
            levelSize: `${prefix}_levelsize`,
            facetData: `facet_${prefix}`
        };
        const { names } = this;
        const mark: RectMark | GroupMark = {
            name: prefix,
            type: groupLayoutProps ? 'group' : 'rect',
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
        parent.scope.marks.push(mark);

        let dataName: string
        let scope: Scope;
        if (groupLayoutProps) {
            dataName = names.facetData;
            const groupMark = mark as GroupMark;
            const { groupby, maxbins } = groupLayoutProps;
            const bin = binnable(prefix, parent.dataName, groupby, maxbins);
            const ord = createOrdinalsForFacet(parent.dataName, prefix, bin.field);
            groupMark.data = [ord.data];
            groupMark.scales = [ord.scale];
            const childMark: GroupMark = {
                type: 'group',
                from: {
                    facet: {
                        name: names.facetData,
                        data: names.dataName,
                        groupby: bin.field
                    }
                }
            };
            groupMark.marks = [childMark];
            scope = childMark;
        }

        this.addData();
        this.addSignals();

        return {
            dataName,
            scope,
            mark: !groupLayoutProps && mark as RectMark,
            sizeSignals: {
                height: names.size,
                width: names.size
            }
        };
    }

    private getBandWidth() {
        const { sizeSignals } = this.props.parent;
        switch (this.props.fillDirection) {
            case 'down-right':
                return sizeSignals.height;
            default:
                return sizeSignals.width;
        }
    }

    private addData() {
        const { parent, sortBy } = this.props;
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
        parent.scope.data = parent.scope.data || [];
        parent.scope.data.push({
            name: names.dataName,
            source: parent.dataName,
            transform
        });
    }

    private addSignals() {
        const { names, props } = this;
        const { fillDirection, global, parent } = props;
        let { maxGroupedFillSize, maxGroupedUnits } = props;

        if (!maxGroupedUnits) {
            maxGroupedUnits = `length(data(${JSON.stringify(parent.dataName)}))`;
        }
        if (!maxGroupedFillSize) {
            maxGroupedFillSize = fillDirection === 'down-right' ? parent.sizeSignals.width : parent.sizeSignals.height;
        }

        const aspect = `((${names.bandWidth})/(${maxGroupedFillSize}))`;

        parent.scope.signals = parent.scope.signals || [];
        push(parent.scope.signals, [
            {
                name: names.aspect,
                update: aspect || `${global.sizeSignals.width}/${props.fillDirection === 'down-right' ? global.sizeSignals.width : global.sizeSignals.height}`
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
        ]);
    }

    private encodeXY(): GroupEncodeEntry {
        const { names } = this;
        const compartment = `${names.bandWidth}/${names.squaresPerBand}*((datum[${JSON.stringify(names.index)}]-1)%${names.squaresPerBand})`;
        const level = `floor((datum[${JSON.stringify(names.index)}]-1)/${names.squaresPerBand})`;
        const { fillDirection, parent } = this.props;
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
                        signal: `(${parent.sizeSignals.height})-${names.levelSize}-${level}*(${names.levelSize}+${names.gap})`
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
