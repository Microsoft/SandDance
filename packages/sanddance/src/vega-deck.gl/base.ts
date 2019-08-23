// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {
    _OrbitController,
    COORDINATE_SYSTEM,
    Deck,
    Layer,
    LinearInterpolator,
    LineLayer,
    OrbitView,
    PolygonLayer,
    TextLayer
} from 'deck.gl';
import {
    CanvasHandler,
    inferType,
    inferTypes,
    loader,
    parse,
    read,
    Renderer,
    renderModule,
    sceneVisit,
    scheme,
    View
} from 'vega-typings';
import { CubeGeometry, fp64, Model } from 'luma.gl';

/**
 * Vega library dependency.
 */
export interface VegaBase {
    CanvasHandler: CanvasHandler;
    inferType: typeof inferType;
    inferTypes: typeof inferTypes;
    loader: typeof loader;
    parse: typeof parse;
    read: typeof read;
    renderModule: typeof renderModule;
    Renderer: typeof Renderer,
    sceneVisit: typeof sceneVisit
    scheme: typeof scheme,
    View: typeof View,
}

let vega: VegaBase = {
    CanvasHandler: null,
    inferType: null,
    inferTypes: null,
    loader: null,
    parse: null,
    read: null,
    renderModule: null,
    Renderer: null,
    sceneVisit: null,
    scheme: null,
    View: null
}

/**
 * deck.gl/core dependency.
 */
export interface DeckBase {
    COORDINATE_SYSTEM: typeof COORDINATE_SYSTEM;
    Deck: typeof Deck;
    Layer: typeof Layer;
    LinearInterpolator: typeof LinearInterpolator;
    OrbitView: typeof OrbitView;
    _OrbitController: typeof _OrbitController;
}

/**
 * deck.gl/layers dependency.
 */
export interface DeckLayerBase {
    LineLayer: typeof LineLayer;
    PolygonLayer: typeof PolygonLayer;
    TextLayer: typeof TextLayer;
}

let deck: DeckBase = {
    COORDINATE_SYSTEM: null,
    Deck: null,
    Layer: null,
    LinearInterpolator: null,
    OrbitView: null,
    _OrbitController: null
}

let layers: DeckLayerBase = {
    LineLayer: null,
    PolygonLayer: null,
    TextLayer: null
}

/**
 * luma.gl dependency.
 */
export interface LumaBase {
    CubeGeometry: typeof CubeGeometry;
    fp64: typeof fp64;
    Model: typeof Model;
}

let luma: LumaBase = {
    CubeGeometry: null,
    fp64: null,
    Model: null
}

/**
 * References to dependency libraries.
 */
export interface Base {
    deck: DeckBase;
    layers: DeckLayerBase;
    luma: LumaBase;
    vega: VegaBase;
    characterSet: string | string[];
}

function getDefaultCharacterSet() {
    const charSet: string[] = [];
    for (let i = 32; i < 128; i++) {
        charSet.push(String.fromCharCode(i));
    }
    return charSet;
}

const characterSet = getDefaultCharacterSet();

/**
 * References to dependency libraries.
 */
export const base: Base = {
    deck,
    layers,
    luma,
    vega,
    characterSet
}

/**
 * Specify the dependency libraries to use for rendering.
 * @param vega Vega library.
 * @param deck deck/core library.
 * @param layers deck/layers library.
 * @param luma luma.gl library.
 */
export function use(vega: VegaBase, deck: DeckBase, layers: DeckLayerBase, luma: LumaBase) {
    base.deck = deck;
    base.layers = layers;
    base.luma = luma;
    base.vega = vega;
}
