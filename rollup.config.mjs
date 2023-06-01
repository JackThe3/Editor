import {nodeResolve} from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import babel from '@rollup/plugin-babel';
export default {
    input: "./editor.mjs",
    output: {
        file: "./editor.bundle.js",
        format: "iife"
    },
    plugins: [nodeResolve()
    ]
}
