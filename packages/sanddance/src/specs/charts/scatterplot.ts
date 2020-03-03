// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { AxisScales } from '../interfaces';
import { Scatter, ScatterProps } from '../layouts/scatter';
import { SignalNames } from '../constants';
import { SpecBuilderProps } from '../specBuilder';
import { SpecContext } from '../types';

export default function (specContext: SpecContext): SpecBuilderProps {
    const { specColumns } = specContext;
    const scatterProps: ScatterProps = {
        x: specColumns.x,
        y: specColumns.y,
        z: specColumns.z,
        addScaleAxes: true
    };
    const axisScales: AxisScales = {
        x: { title: specColumns.x && specColumns.x.name },
        y: { title: specColumns.y && specColumns.y.name },
        z: { title: specColumns.z && specColumns.z.name }
    };
    return {
        axisScales,
        layouts: [
            {
                layoutClass: Scatter,
                props: scatterProps
            }
        ],
        specCapabilities: {
            roles: [
                {
                    role: 'x',
                    axisSelection: specColumns.x && specColumns.x.quantitative ? 'range' : 'exact'
                },
                {
                    role: 'y',
                    axisSelection: specColumns.y && specColumns.y.quantitative ? 'range' : 'exact'
                },
                {
                    role: 'z',
                    allowNone: true
                },
                {
                    role: 'color',
                    allowNone: true
                },
                {
                    role: 'facet',
                    allowNone: true
                },
                {
                    role: 'facetV',
                    allowNone: true
                }
            ],
            signals: [SignalNames.PointSize]
        }
    };
}
