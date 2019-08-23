// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as React from 'react';
import { ColumnMap, Props as ColumnMapProps } from './controls/columnMap';
import { FabricTypes } from '@msrvida/office-ui-fabric-react-cdn-typings';
import { SandDance } from '@msrvida/sanddance-react';
import { TextLayerDatum } from '@deck.gl/layers/text-layer/text-layer';

interface TextWithSpecRole extends TextLayerDatum {
    specRole: SandDance.types.SpecRoleCapabilities;
}

export interface Position {
    top: number;
    left: number;
}

export function injectClickableTextLayer(
    stage: SandDance.VegaDeckGl.types.Stage,
    stageToLayers: SandDance.VegaDeckGl.types.StageToLayers,
    specCapabilities: SandDance.types.SpecCapabilities,
    textClick: (pos: Position, specRole: SandDance.types.SpecRoleCapabilities) => void,
    getColors: () => SandDance.types.ColorSettings
) {
    const clickableTextData: TextWithSpecRole[] = [];
    const originalAxes = SandDance.VegaDeckGl.util.clone(stage.axes);
    for (let axisName in stage.axes) {
        specCapabilities.roles.forEach(specRole => {
            if (specRole.role === axisName) {
                let axes = stage.axes[axisName] as SandDance.VegaDeckGl.types.Axis[];
                axes.forEach(axis => {
                    if (axis.title) {
                        const textItem = axis.title as TextWithSpecRole;
                        textItem.specRole = specRole;
                        clickableTextData.push(textItem);
                        delete axis.title;
                    }
                });
            }
        });
    }
    const layers = stageToLayers(stage);
    stage.axes = originalAxes;
    if (clickableTextData.length > 0) {
        const onTextClick = (e: MouseEvent | PointerEvent | TouchEvent, text: TextWithSpecRole) => {
            textClick(getPosition(e), text.specRole);
        };
        const clickableTextLayer = newClickableTextLayer('LAYER_CLICKABLE_TEXT', onTextClick, clickableTextData, getColors());
        layers.push(clickableTextLayer);
    }
    return layers;
}

function hasClientXY(e: MouseEvent | PointerEvent | Touch) {
    if (e.clientX !== undefined && e.clientX !== undefined) {
        return { top: e.clientY, left: e.clientX };
    }
}

function getPosition(e: MouseEvent | PointerEvent | TouchEvent): Position {
    let xy = hasClientXY(e as MouseEvent | PointerEvent);
    if (xy) {
        return xy;
    }
    const te = e as TouchEvent;
    for (let i = 0; i < te.touches.length; i++) {
        let xy = hasClientXY(te.touches[i]);
        if (xy) {
            return xy;
        }
    }
}

function newClickableTextLayer(id: string, onTextClick: (e: MouseEvent | PointerEvent | TouchEvent, text: TextWithSpecRole) => void, data: TextWithSpecRole[], colors: SandDance.types.ColorSettings) {
    const highlightColor = [...colors.axisText];
    highlightColor[3] = 72;
    return new SandDance.VegaDeckGl.base.layers.TextLayer({
        id,
        data,
        coordinateSystem: SandDance.VegaDeckGl.base.deck.COORDINATE_SYSTEM.IDENTITY,
        autoHighlight: true,
        highlightColor,
        pickable: true,
        onClick: (o, e) => onTextClick(e && e.srcEvent, o.object as TextWithSpecRole),
        getColor: colors.axisText,
        getTextAnchor: o => o.textAnchor,
        getSize: o => o.size,
        getAngle: o => o.angle,
        fontSettings: {
            fontSize: 128,
            sdf: true,
            radius: 5
        }
    });
}

export interface PositionedColumnMapProps extends ColumnMapProps, Position { }

export class ActiveDropdown extends React.Component<PositionedColumnMapProps, {}> {
    private dropdownRef?: React.RefObject<FabricTypes.IDropdown>;

    constructor(props: PositionedColumnMapProps) {
        super(props);
        this.dropdownRef = React.createRef<FabricTypes.IDropdown>();
    }

    componentDidMount() {
        this.dropdownRef.current!.focus(true);
    }

    render() {
        return (
            <div
                className="sanddance-columnMap-absolute"
                style={{ position: 'absolute', left: this.props.left + 'px', top: this.props.top + 'px' }}
            >
                <ColumnMap
                    {...this.props}
                    componentRef={this.dropdownRef}
                    hideSignals={true}
                />
            </div>
        );
    }
}