import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';
import buble from '@rollup/plugin-buble';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/wrapper.js',
    output: {
        name: 'SandDanceVue',
        exports: 'named',
    },
    plugins: [
        commonjs(),
        vue({
            css: true,
            compileTemplate: true,
        }),
        resolve(),
        typescript(),
        buble({
            transforms: {
                generator: false
            }
        }),
    ],
};
