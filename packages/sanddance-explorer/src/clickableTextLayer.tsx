// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as React from 'react';
import { base } from './base';
import { SandDance } from '@msrvida/sanddance-react';
import { TextLayerDatum } from '@deck.gl/layers/text-layer/text-layer';
import { Props as ColumnMapProps2, ColumnMap } from './controls/columnMap';
import { FabricTypes } from '@msrvida/office-ui-fabric-react-cdn-typings';

interface Zzz extends TextLayerDatum {
    specRole: SandDance.types.SpecRoleCapabilities;
}

export function onBeforeCreateLayers(
    stage: SandDance.VegaDeckGl.types.Stage,
    layerFn: SandDance.VegaDeckGl.types.LayerFn,
    specCapabilities: SandDance.types.SpecCapabilities,
    clickFn: (aprops: IProps) => void) {
    const clickableTextData: Zzz[] = [];
    const pristineAxes = SandDance.VegaDeckGl.util.clone(stage.axes);
    for (let axisName in stage.axes) {
        specCapabilities.roles.forEach(specRole => {
            if (specRole.role === axisName) {
                let axes = stage.axes[axisName] as SandDance.VegaDeckGl.types.Axis[];
                axes.forEach(axis => {
                    if (axis.title) {
                        const z = axis.title as Zzz;
                        z.specRole = specRole;
                        clickableTextData.push(z);
                        delete axis.title;
                    }
                });
            }
        });
    }
    const layers = layerFn(stage);
    stage.axes = pristineAxes;
    if (clickableTextData.length > 0) {
        const onTextClick = (e: MouseEvent | PointerEvent | TouchEvent, text: Zzz) => {
            let clientX: number;
            let clientY: number;
            const ep = e as MouseEvent | PointerEvent;
            if (ep.clientX) {
                clientX = ep.clientX;
                clientY = ep.clientY;
            }
            const aprops: IProps = {
                clientX,
                clientY,
                specRole: text.specRole
            };
            console.log('clicked', text, aprops);
            clickFn(aprops);
        };
        const clickableTextLayer = newClickableTextLayer("z", onTextClick, clickableTextData, [0, 0, 200, 255]);
        layers.splice(1, 0, clickableTextLayer);
    }
    return layers;
}


function newClickableTextLayer(id: string, onTextClick: (e: MouseEvent | PointerEvent | TouchEvent, text: Zzz) => void, data: Zzz[], highlightColor: number[]) {
    return new base.layers.TextLayer({
        id,
        data,
        coordinateSystem: base.deck.COORDINATE_SYSTEM.IDENTITY,
        autoHighlight: true,
        highlightColor,
        pickable: true,
        onClick: (o, e) => onTextClick(e && e.srcEvent, o.object as Zzz),
        getColor: [64, 64, 255, 255],
        getTextAnchor: o => o.textAnchor,
        getSize: o => o.size,
        getAngle: o => o.angle
    });
}

export interface IProps {
    clientX: number;
    clientY: number;
    specRole: SandDance.types.SpecRoleCapabilities;
}

export interface ActiveDropdownProps {
    clientX: number;
    clientY: number;
    columnMapProps2: ColumnMapProps2;
}

export class ActiveDropdown extends React.Component<ActiveDropdownProps, {}> {
    private dropdownRef?: React.RefObject<FabricTypes.IDropdown>;

    constructor(props: ActiveDropdownProps) {
        super(props);
        this.dropdownRef = React.createRef<FabricTypes.IDropdown>();
    }

    componentDidMount() {
        this.dropdownRef.current!.focus(true);
    }

    render() {
        return (
            <div style={{ position: 'absolute', zIndex: 1, left: this.props.clientX, top: this.props.clientY }}>
                <ColumnMap
                    {...this.props.columnMapProps2}
                    componentRef={this.dropdownRef}
                    hideSignals={true}
                />
            </div>
        );
    }
}
