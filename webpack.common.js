const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src/scripts/index.js"),
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
    parser: {
      javascript: {
        importMeta: true,
      },
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/index.html"),
      scriptLoading: "module",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/model", to: "model" },
        { from: "src/public", to: "." },
        {
          from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs",
          to: "ort/ort-wasm-simd-threaded.jsep.mjs",
        },
        {
          from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
          to: "ort/ort-wasm-simd-threaded.jsep.wasm",
        },
        {
          from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
          to: "ort/ort-wasm-simd-threaded.mjs",
        },
        {
          from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
          to: "ort/ort-wasm-simd-threaded.wasm",
        },
      ],
    }),
  ],
  stats: {
    warningsFilter: /import\.meta/,
  },
};
