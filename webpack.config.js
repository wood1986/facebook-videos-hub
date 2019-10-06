const path = require("path"),
      HtmlWebpackPlugin = require("html-webpack-plugin"),
      {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer"),
      TerserPlugin = require("terser-webpack-plugin"),
      {CleanWebpackPlugin} = require("clean-webpack-plugin");

module.exports = (env, argv) => {  // eslint-disable-line max-lines-per-function
  const PROD = argv.mode === "production";

  return {
    "devServer": {
      "host": "0.0.0.0",
      "open": true,
      "useLocalIp": true
    },
    "devtool": false,
    "entry": {
      "index": path.resolve(__dirname, "src", "index.jsx")
    },
    "module": {
      "rules": [
        {
          "enforce": "pre",
          "exclude": /node_modules/u,
          "loader": "eslint-loader",
          "options": {
            "configFile": path.resolve(__dirname, ".eslintrc.js"),
            "fix": true
          },
          "test": /\.jsx?$/u
        },
        {
          "exclude": /node_modules/u,
          "test": /\.jsx?$/u,
          "use": [
            {
              "loader": "babel-loader",
              "options": {
                "plugins": [["babel-plugin-styled-components", {"displayName": !PROD}]],
                "presets": ["@babel/preset-react"]
              }
            }
          ]
        }
      ]
    },
    "optimization": {
      "minimizer": PROD ? [new TerserPlugin({
        "terserOptions": {
          "output": {
            "comments": false
          }
        }
      })] : [],
      "runtimeChunk": {
        "name": "vendors"
      },
      "splitChunks": {
        "cacheGroups": {
          "vendors": {
            "chunks": "all",
            "name": "vendors",
            "test": /[\\/]node_modules[\\/]/u
          }
        }
      }
    },
    "output": {
      "filename": `[name].js`,
      "libraryTarget": "umd",
      "path": path.resolve(__dirname, "dist")
    },
    "plugins": [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        "filename": "index.html",
        "minify": {
          "collapseWhitespace": PROD,
          "removeComments": PROD
        },
        "template": path.resolve(__dirname, "src", "index.ejs")
      })
    ],
    "resolve": {
      extensions: [".js", ".json", ".jsx", ".mjs"]
    },
    "target": "web"
  };
};