// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

//adapted from https://github.com/uber/deck.gl/blob/6.4-release/modules/layers/src/text-layer/multi-icon-layer/multi-icon-layer-fragment.glsl.js

export default `\
#define SHADER_NAME multi-icon-layer-fragment-shader

precision highp float;

uniform sampler2D iconsTexture;
uniform float buffer;
uniform bool sdf;

varying vec4 vColor;
varying vec2 vTextureCoords;
varying float vGamma;
varying vec4 vHighlightColor;

const float MIN_ALPHA = 0.05;

void main(void) {
  vec4 texColor = texture2D(iconsTexture, vTextureCoords);
  
  float alpha = texColor.a;

  // if enable sdf (signed distance fields)	
  if (sdf) {	
    float distance = texture2D(iconsTexture, vTextureCoords).a;	
    alpha = smoothstep(buffer - vGamma, buffer + vGamma, distance);	
  }

  // Take the global opacity and the alpha from vColor into account for the alpha component
  float a = alpha * vColor.a;

  if (picking_uActive) {

    // use picking color for entire rectangle
    gl_FragColor = vec4(picking_vRGBcolor_Aselected.rgb, 1.0);
  
  } else {

    if (a < MIN_ALPHA) {
      discard;
    } else {

      gl_FragColor = vec4(vColor.rgb, a);

      // use highlight color if this fragment belongs to the selected object.
      bool selected = bool(picking_vRGBcolor_Aselected.a);
      if (selected) {
        gl_FragColor = vec4(vHighlightColor.rgb, a);
      }
    }
  }
}
`;
