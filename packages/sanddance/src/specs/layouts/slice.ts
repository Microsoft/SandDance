// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { addTransforms, getDataByName } from '../scope';
import { binnable, Binnable } from '../bin';
import { DiscreteColumn, InnerScope, Orientation } from '../interfaces';
import { Layout, LayoutBuildProps, LayoutProps } from './layout';
import { Mark } from 'vega-typings';

export interface SliceProps extends LayoutProps {
    groupby: DiscreteColumn;
    orientation: Orientation;
}

export class Slice extends Layout {
    private bin: Binnable;

    constructor(public props: SliceProps & LayoutBuildProps) {
        super(props);
        this.prefix = `slice_${this.id}`;
        this.bin = binnable(this.prefix, props.globalScope.dataName, props.groupby);
    }

    public getGrouping() {
        return this.bin.fields;
    }

    public build(): InnerScope {
        const { bin, prefix, props } = this;
        const { globalScope, parentScope } = props;
        const facetDataName = `data_${prefix}_facet`;

        if (bin.native === false) {
            globalScope.scope.signals.push(bin.maxbinsSignal);
            addTransforms(getDataByName(globalScope.scope.data, globalScope.dataName), ...bin.transforms);
            globalScope.scope.data.push(bin.dataSequence);
        }
        const mark: Mark = {
            style: 'cell',
            name: prefix,
            type: 'group',
            from: {
                facet: {
                    name: facetDataName,
                    data: parentScope.dataName,
                    groupby: bin.fields
                }
            },
            encode: {
            },
            marks: [
                {
                    type: 'text',
                    encode: {
                        update: {
                            text: {
                                signal: `length(data(${JSON.stringify(facetDataName)}))`
                            },
                            fontSize: {
                                value: 20
                            }
                        }
                    }
                }
            ]
        };
        parentScope.scope.marks.push(mark);

        return {
            dataName: facetDataName,
            scope: mark,
            sizeSignals: { layoutHeight: 'TODO', layoutWidth: 'TODO' }
        };

    }
}
