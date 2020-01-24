// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { Column } from '../types';
import {
    GroupEncodeEntry,
    Mark,
    RectMark,
    Scope,
    Transforms
} from 'vega-typings';
import { InnerScope } from '../interfaces';
import { Layout, LayoutBuildProps, LayoutProps } from './layout';
import { push } from '../../array';

export interface SquareProps extends LayoutProps {
    sortBy: Column;
    fillDirection: 'right-down' | 'right-up' | 'down-right';
    maxSignal?: string;
    aspect?: string;
    commonSize?: string;
    markType: 'group' | 'rect';
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
        levelSize: string
    }

    public build(): InnerScope {
        const { props } = this;
        const { fillDirection, global, markType, parent, sortBy } = props;
        let { maxSignal } = props;
        const prefix = `square_${this.id}`;
        this.names = {
            dataName: `facet_${prefix}`,
            aspect: `${prefix}_aspect`,
            bandWidth: this.getBandWidth(),
            squaresPerBand: `${prefix}_squares_per_band`,
            index: `${prefix}_index`,
            gap: `${prefix}_gap`,
            size: `${prefix}_size`,
            levels: `${prefix}_levels`,
            levelSize: `${prefix}_levelsize`
        };
        const { names } = this;
        const mark: Mark = {
            name: prefix,
            type: markType,
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

        if (!maxSignal) {
            maxSignal = `length(data(${JSON.stringify(parent.dataName)}))`;
        }
        parent.scope.signals = parent.scope.signals || [];
        push(parent.scope.signals, [
            {
                name: names.aspect,
                update: props.aspect || `${global.sizeSignals.width}/${props.fillDirection === 'down-right' ? global.sizeSignals.width : global.sizeSignals.height}`
            },
            {
                name: names.squaresPerBand,
                update: `ceil(sqrt(${maxSignal}*${names.aspect}))`
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
                update: `ceil(${maxSignal}/${names.squaresPerBand})`
            },
            {
                name: names.levelSize,
                update: `((${this.props.commonSize})/${names.levels})-${names.gap}`
            }
        ]);

        return {
            dataName: names.dataName,
            scope: markType === 'group' && <Scope>mark,
            mark: markType === 'rect' && <RectMark>mark,
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
