const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var config = {
    target: 'electron-renderer',
    entry: ['@babel/polyfill', './app/src/main.jsx'],
    output: {
        publicPath: 'dist/',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'app/dist'),
    },
    module: {
        rules: [
            {
                test: /\.[tj]sx?$/,
                exclude: /(node_modules|bower_components)/,
                use: ['babel-loader'],
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    loader: 'css-loader',
                    options: {
                        modules: true,
                    },
                }),
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]?[hash]',
                },
            },
        ],
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true,
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
            '~src': path.resolve(__dirname, 'app/src/'),
            '~model': path.resolve(__dirname, 'app/src/model/'),
            '~ui': path.resolve(__dirname, 'app/src/ui/'),
            '~page': path.resolve(__dirname, 'app/src/ui/page/'),
            '~css': path.resolve(__dirname, 'app/src/css/'),
        },
    },
};

module.exports = config;
