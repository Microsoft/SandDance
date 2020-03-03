// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export const FieldNames = {
    Active: '__SandDance__Active',
    Collapsed: '__SandDance__Collapsed',
    Contains: '__SandDance__Contains',
    Selected: '__SandDance__Selected',
    Top: '__SandDance__Top',
    TopColor: '__SandDance__TopColor',
    TopIndex: '__SandDance__TopIndex',
    PowerBISelectionId: '__SandDance__PowerBISelectionId',
    FacetRange: '__SandDance__FacetRange',
    Ordinal: '__SandDance__Ordinal',
    WrapCol: '__SandDance__WrapCol',
    WrapRow: '__SandDance__WrapRow'
};

export const DataNames = {
    Main: 'MainData',
    EmptyBin: 'EmptyBinsData',
    FacetCellColTitles: 'data_FacetCellColTitles',
    FacetCellRowTitles: 'data_FacetCellRowTitles',
    QuantitativeData: 'QuantitativeData'
};

export const ScaleNames = {
    Color: 'scale_color',
    X: 'scale_x',
    Y: 'scale_y',
    Z: 'scale_z'
};

//Signal names
export const SignalNames = {
    ViewportWidth: 'ViewportWidth',
    ViewportHeight: 'ViewportHeight',
    MinCellWidth: 'MinCellWidth',
    MinCellHeight: 'MinCellHeight',
    PlotOffsetLeft: 'PlotOffsetLeft',
    PlotOffsetTop: 'PlotOffsetTop',
    PlotOffsetBottom: 'PlotOffsetBottom',
    PlotHeightIn: 'PlotHeightIn',
    PlotWidthIn: 'PlotWidthIn',
    PlotHeightOut: 'PlotHeightOut',
    PlotWidthOut: 'PlotWidthOut',
    ColorBinCount: 'RoleColor_BinCountSignal',
    ColorReverse: 'RoleColor_ReverseSignal',
    FacetBins: 'RoleFacet_BinsSignal',
    FacetVBins: 'RoleFacetV_BinsSignal',
    MarkOpacity: 'Mark_OpacitySignal',
    PointSize: 'Chart_PointSizeSignal',
    TextAngleX: 'Text_AngleXSignal',
    TextAngleY: 'Text_AngleYSignal',
    TextScale: 'Text_ScaleSignal',
    TextSize: 'Text_SizeSignal',
    TextTitleSize: 'Text_TitleSizeSignal',
    TreeMapMethod: 'Chart_TreeMapMethodSignal',
    XBins: 'RoleX_BinsSignal',
    YBins: 'RoleY_BinsSignal',
    ZHeight: 'RoleZ_HeightSignal',
    ZProportion: 'RoleZ_ProportionSignal'
};

//These are special formulaic data values
export const Other = '__Other';

//name of the "no-color" palette
export const ColorScaleNone = 'none';
