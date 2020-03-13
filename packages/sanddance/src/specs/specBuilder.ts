// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { addColor } from './color';
import {
    addFacetAxesGroupMarks,
    addFacetCellTitles,
    addFacetColRowTitles,
    FacetLayout,
    getFacetLayout
} from './facetLayout';
import { addGlobalAxes, AxesScopeMap } from './axes';
import { addScale, addSignal } from './scope';
import {
    axesOffsetX,
    axesOffsetY,
    axesTitlePaddingFacetX,
    axesTitlePaddingFacetY,
    axesTitlePaddingX,
    axesTitlePaddingY,
    defaultBins,
    maxbins
} from './defaults';
import {
    AxisScales,
    DiscreteColumn,
    EncodingRule,
    GlobalScales,
    GlobalScope,
    InnerScope,
    SpecResult
} from './interfaces';
import { fill, opacity } from './fill';
import {
    GroupMark,
    NewSignal,
    Scope,
    Spec
} from 'vega-typings';
import { LayoutBuildProps, LayoutPair, LayoutProps } from './layouts/layout';
import { minFacetHeight, minFacetWidth } from './defaults';
import { ScaleNames, SignalNames } from './constants';
import { SpecCapabilities, SpecContext } from './types';
import { textSignals } from './signals';

export interface SpecBuilderProps {
    axisScales?: AxisScales;
    layouts: LayoutPair[];
    errors?: string[];
    specCapabilities: SpecCapabilities;
    customZScale?: boolean;
}

export class SpecBuilder {
    private minCellWidth: NewSignal;
    private minCellHeight: NewSignal;
    private plotOffsetLeft: NewSignal;
    private plotOffsetTop: NewSignal;
    private plotOffsetBottom: NewSignal;
    private plotOffsetRight: NewSignal;
    private plotHeightOut: NewSignal;
    private plotWidthOut: NewSignal;

    constructor(public props: SpecBuilderProps & { specContext: SpecContext }) {
        this.minCellWidth = {
            name: SignalNames.MinCellWidth,
            update: `${minFacetWidth}`
        };
        this.minCellHeight = { name: SignalNames.MinCellHeight, update: `${minFacetHeight}` };
        this.plotOffsetLeft = { name: SignalNames.PlotOffsetLeft, update: `0` };
        this.plotOffsetTop = { name: SignalNames.PlotOffsetTop, update: `0` };
        this.plotOffsetBottom = { name: SignalNames.PlotOffsetBottom, update: `0` };
        this.plotOffsetRight = { name: SignalNames.PlotOffsetRight, update: `0` };
        this.plotHeightOut = { name: SignalNames.PlotHeightOut, update: SignalNames.PlotHeightIn };
        this.plotWidthOut = { name: SignalNames.PlotWidthOut, update: SignalNames.PlotWidthIn };
    }

    public validate() {
        const { specCapabilities, specContext } = this.props;
        const { roles } = specCapabilities;
        const required = roles.filter(r => !r.allowNone);
        const numeric = roles.filter(r => r.excludeCategoric);
        const errors = required
            .map(
                r => {
                    if (specContext.specColumns[r.role]) {
                        return null;
                    } else {
                        return `Field ${r.role} is required.`;
                    }
                }
            )
            .concat(
                numeric.map(
                    r => {
                        if (specContext.specColumns[r.role] && !specContext.specColumns[r.role].quantitative) {
                            return `Field ${r.role} must be quantitative.`;
                        } else {
                            return null;
                        }
                    }
                )
            )
            .filter(Boolean);
        return errors;
    }

    public build(): SpecResult {
        const { specCapabilities } = this.props;
        const errors = this.validate();
        if (errors.length) {
            return {
                errors,
                specCapabilities,
                vegaSpec: null
            }
        } else {
            const { specContext } = this.props;
            const { insight, specColumns, specViewOptions } = specContext;
            const dataName = 'data_source';
            const { vegaSpec, groupMark } = this.initSpec(dataName);
            const { topColorField, colorDataName } = addColor({
                scope: vegaSpec,
                dataName,
                specContext,
                scaleName: ScaleNames.Color,
                legendDataName: 'data_legend',
                topLookupName: 'data_topcolorlookup',
                colorReverseSignalName: SignalNames.ColorReverse
            });
            const globalScope = this.createGlobalScope(colorDataName, vegaSpec);
            let facetLayout: FacetLayout;
            if (insight.columns.facet) {
                const discreteFacetColumn: DiscreteColumn = {
                    column: specColumns.facet,
                    defaultBins,
                    maxbins,
                    maxbinsSignalDisplayName: specViewOptions.language.FacetMaxBins,
                    maxbinsSignalName: SignalNames.FacetBins
                };
                const discreteFacetVColumn: DiscreteColumn = {
                    column: specColumns.facetV,
                    defaultBins,
                    maxbins,
                    maxbinsSignalDisplayName: specViewOptions.language.FacetVMaxBins,
                    maxbinsSignalName: SignalNames.FacetVBins
                };
                facetLayout = getFacetLayout(insight.facetStyle, discreteFacetColumn, discreteFacetVColumn);
                addSignal(vegaSpec, ...facetLayout.signals);
                addScale(vegaSpec, ...facetLayout.scales);
                this.props.layouts = [facetLayout.layoutPair, ...this.props.layouts];
                this.plotOffsetTop.update = `${facetLayout.plotPadding.y}`;
                this.plotOffsetRight.update = `${facetLayout.plotPadding.x}`
            }
            const { firstScope, finalScope, specResult, allGlobalScales, allEncodingRules } = this.iterateLayouts(globalScope, groupMark, colorDataName);
            if (specResult) {
                return specResult;
            }
            if (facetLayout && facetLayout.cellTitles) {
                addFacetCellTitles(firstScope.scope, firstScope.sizeSignals, specViewOptions, specColumns.facet);
                if (firstScope.emptyScope) {
                    addFacetCellTitles(firstScope.emptyScope, firstScope.sizeSignals, specViewOptions, specColumns.facet);
                }
            }
            if (facetLayout && facetLayout.colRowTitles && firstScope.titles) {
                addFacetColRowTitles(globalScope.scope, firstScope.titles.x, firstScope.titles.y, firstScope.sizeSignals);
            }
            if (allGlobalScales.length > 0) {
                let axesScopes: AxesScopeMap = facetLayout ?
                    addFacetAxesGroupMarks({
                        globalScope: globalScope.scope,
                        plotScope: groupMark,
                        facetScope: firstScope,
                        plotHeightOut: this.plotHeightOut.name,
                        plotWidthOut: this.plotWidthOut.name,
                        colTitleScaleName: 'scale_facet_col_title',
                        rowTitleScaleName: 'scale_facet_row_title',
                        colSeqName: 'data_FacetCellColTitles',
                        rowSeqName: 'data_FacetCellRowTitles'
                    })
                    :
                    {
                        main: [{
                            scope: groupMark,
                            lines: true,
                            labels: true,
                            title: true
                        }]
                    };
                addGlobalAxes({
                    globalScope,
                    allGlobalScales,
                    axisScales: this.props.axisScales,
                    plotOffsetSignals: { x: this.plotOffsetLeft, y: this.plotOffsetBottom },
                    axesOffsets: { x: axesOffsetX, y: axesOffsetY },
                    axesTitlePadding: facetLayout ? { x: axesTitlePaddingFacetX, y: axesTitlePaddingFacetY } : { x: axesTitlePaddingX, y: axesTitlePaddingY },
                    labelBaseline: { x: 'top', y: 'middle' },
                    specColumns,
                    specViewOptions,
                    axesScopes
                });
            }
            //add mark to the final scope
            if (finalScope.mark) {
                const { update } = finalScope.mark.encode;

                allEncodingRules.forEach(map => {
                    for (let key in map) {
                        if (update[key]) {
                            let arrIn = map[key];
                            if (!Array.isArray(update[key])) {
                                let value = update[key];
                                let arrOut = [];
                                update[key] = arrOut;
                                arrIn.forEach(rule => arrOut.push(rule));
                                arrOut.push(value);
                            } else {
                                let arrOut = update[key] as {}[];
                                arrIn.forEach(rule => arrOut.unshift(rule));
                            }
                        }
                    }
                });

                update.fill = fill(specContext, topColorField, ScaleNames.Color);
                update.opacity = opacity(specContext);
            }
            return {
                specCapabilities,
                vegaSpec
            }
        }
    }

    private createGlobalScope(dataName: string, scope: Spec) {
        const { minCellWidth, minCellHeight, plotHeightOut, plotWidthOut } = this;
        const globalScope: GlobalScope = {
            dataName,
            scope,
            sizeSignals: {
                layoutHeight: SignalNames.PlotHeightIn,
                layoutWidth: SignalNames.PlotWidthIn
            },
            signals: {
                minCellWidth,
                minCellHeight,
                plotHeightOut,
                plotWidthOut
            }
        };
        return globalScope;
    }

    private initSpec(dataName: string) {
        const { minCellWidth, minCellHeight, plotOffsetLeft, plotOffsetBottom, plotOffsetTop, plotOffsetRight, plotHeightOut, plotWidthOut } = this;
        const { specContext } = this.props;
        const { insight } = specContext;
        const groupMark: GroupMark = {
            type: 'group',
            //style: 'cell',
            encode: {
                update: {
                    x: { signal: SignalNames.PlotOffsetLeft },
                    y: { signal: SignalNames.PlotOffsetTop },
                    height: { signal: SignalNames.PlotHeightOut },
                    width: { signal: SignalNames.PlotWidthOut }
                }
            }
        };
        const source = 'origin';
        const vegaSpec: Spec = {
            $schema: 'https://vega.github.io/schema/vega/v5.json',
            //style: 'cell',
            data: [{ name: source }, { name: dataName, source, transform: [] }],
            marks: [groupMark],
            signals: textSignals(specContext, SignalNames.ViewportHeight).concat([
                minCellWidth,
                minCellHeight,
                {
                    name: SignalNames.ViewportHeight,
                    update: `max(${SignalNames.MinCellHeight}, ${insight.size.height})`
                },
                {
                    name: SignalNames.ViewportWidth,
                    update: `max(${SignalNames.MinCellWidth}, ${insight.size.width})`
                },
                plotOffsetLeft,
                plotOffsetTop,
                plotOffsetBottom,
                plotOffsetRight,
                {
                    name: SignalNames.PlotHeightIn,
                    update: `${SignalNames.ViewportHeight} - ${SignalNames.PlotOffsetBottom}`
                },
                {
                    name: SignalNames.PlotWidthIn,
                    update: `${SignalNames.ViewportWidth} - ${SignalNames.PlotOffsetLeft} - ${SignalNames.PlotOffsetRight}`
                },
                plotHeightOut,
                plotWidthOut,
                {
                    name: 'height',
                    update: `${SignalNames.PlotOffsetTop} + ${SignalNames.PlotHeightOut} + ${SignalNames.PlotOffsetBottom}`
                },
                {
                    name: 'width',
                    update: `${SignalNames.PlotWidthOut} + ${SignalNames.PlotOffsetLeft} + ${SignalNames.PlotOffsetRight}`
                }
            ])
        };
        return { vegaSpec, groupMark };
    }

    private iterateLayouts(globalScope: GlobalScope, scope: Scope, dataName: string) {
        let specResult: SpecResult;
        let parentScope: InnerScope = {
            dataName,
            sizeSignals: globalScope.sizeSignals,
            scope
        };
        let firstScope: InnerScope;
        let childScope: InnerScope;
        const groupings: string[][] = [];
        let { layouts, specCapabilities } = this.props;
        const allGlobalScales: GlobalScales[] = [];
        const allEncodingRules: { [key: string]: EncodingRule[] }[] = [];
        for (let i = 0; i < layouts.length; i++) {
            if (!parentScope) continue;
            if (!parentScope.scope) break;
            if (!parentScope.scope.marks) {
                parentScope.scope.marks = [];
            }
            let buildProps: LayoutBuildProps = {
                globalScope,
                parentScope,
                axesScales: this.props.axisScales,
                groupings,
                id: i
            };
            let layout = this.createLayout(layouts[i], buildProps);
            try {
                childScope = layout.build();
                let grouping = layout.getGrouping();
                if (grouping) {
                    groupings.push(grouping);
                }
            }
            catch (e) {
                specResult = {
                    errors: [e.stack],
                    specCapabilities,
                    vegaSpec: null
                };
                break;
            }
            if (childScope && childScope.globalScales) {
                allGlobalScales.push(childScope.globalScales);
            }
            if (childScope.encodingRuleMap) {
                allEncodingRules.push(childScope.encodingRuleMap);
            }
            if (i === 0) {
                firstScope = childScope;
            }
            parentScope = childScope;
        }
        return { firstScope, finalScope: parentScope, specResult, allGlobalScales, allEncodingRules };
    }

    private createLayout(layoutPair: LayoutPair, buildProps: LayoutBuildProps) {
        const { layoutClass, props } = layoutPair;
        const layoutBuildProps: LayoutProps & LayoutBuildProps = {
            ...props,
            ...buildProps
        };
        const layout = new layoutClass(layoutBuildProps);
        layout.id = buildProps.id;
        return layout;
    }
}
