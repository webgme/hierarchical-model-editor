/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 */

const path = require('path');
const WrapperPlugin = require('wrapper-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    devtool: 'source-map',
    entry: './src/visualizers/panels/HierarchicalModelEditor/src/index.jsx',
    mode: 'development',
    output: {
        filename: 'HierarchicalModelEditor.bundle.js',
        path: path.join(__dirname, './src/visualizers/panels/HierarchicalModelEditor/'),
    },
    plugins: [
        new WrapperPlugin({
            test: /\.js$/,
            header: 'define([], function () {\nreturn function (VISUALIZER_INSTANCE_ID) {',
            footer: '};\n});',
        }),
        new MiniCssExtractPlugin({filename: 'HierarchicalModelEditor.bundle.css'}),
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                ],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {},
                    },
                    'css-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};
