'use strict';

const path = require('path');
const webpack = require('webpack');
const uppercamelcase = require('uppercamelcase');
const RaxPlugin = require('rax-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const fs = require('fs');

const PACKAGES_NAME = 'components';
const PACKAGES_DIR = path.resolve(__dirname, `../${PACKAGES_NAME}`);

fs.readdirSync(PACKAGES_DIR)
  .forEach(function(packageName) {
    var main = path.join(PACKAGES_DIR, packageName + '/src/index.js');
    var entryName = packageName.split('-')[1];
    var globalName = uppercamelcase(packageName);

    var entry = {};
    entry[entryName] = entry[entryName + '.min'] = entry[entryName + '.factory'] = main;
    dist(getConfig(
      entry,
      {
        path: `./${PACKAGES_NAME}/${packageName}/dist/`,
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        pathinfo: false,
      },
      {
        externalBuiltinModules: true,
        builtinModules: Object.assign({
          mobx: ['mobx'],
          redux: ['redux']
        }, RaxPlugin.BuiltinModules),
        moduleName: packageName,
        globalName: globalName,
      },
      {
        presets: ['es2015', 'rax']
      }
    )).catch(function(err) {
      setTimeout(function() {
        throw err;
      });
    });
  });


function getConfig(entry, output, moduleOptions, babelLoaderQuery, target, devtool) {
  // Webpack need an absolute path
  output.path = path.resolve(__dirname, '..', output.path);

  return {
    mode: 'production',
    target: target || 'node',
    devtool: devtool || 'source-map',
    optimization: {
      minimize: false
    },
    stats: {
      optimizationBailout: true,
    },
    entry: entry,
    output: output,
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      new RaxPlugin(moduleOptions),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new UglifyJSPlugin({
        include: /\.min\.js$/,
        sourceMap: true
      })
    ],
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
        options: babelLoaderQuery
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'stylesheet-loader'
          }
        ],
      }]
    }
  };
}

function dist(config) {
  return new Promise(function(resolver, reject) {
    let compiler = webpack(config);
    compiler.run(function(err, stats) {
      let options = {
        colors: true,
        chunks: false,
        errorDetails: true,
      };
      console.log(stats.toString(options));
      resolver();
    });
  });
}
