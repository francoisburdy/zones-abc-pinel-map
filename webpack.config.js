import * as path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack'

const __filename = fileURLToPath(import.meta.url);

export default {
  entry: [
    './src/app.js',
    './src/app.sass',
    './src/index.html',
  ],
  output: {
    filename: 'app.js',
    path: path.resolve(path.dirname(__filename), 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: [
          {
            loader: 'file-loader',
            options: { name: '[name].html' }

          },
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: 'file-loader',
            options: { name: '[name].css' }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        }
      },
    ],

  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm-bundler.js'
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    }),
  ],
};
