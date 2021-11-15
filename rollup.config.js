import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "./release/lib/index.js",
  output: [
    {
      plugins: [terser()],
      sourcemap: true,
      name: "RTCCore",
      file: "release/rtc-core.umd.js",
      format: "umd",
      indent: false,
    },
    {
      sourcemap: true,
      name: "RTCCore",
      file: "release/rtc-core.cjs.js",
      format: "cjs",
      indent: false,
    },
    {
      sourcemap: true,
      name: "RTCCore",
      file: "release/rtc-core.esm.js",
      format: "esm",
      indent: false,
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
  ]
};