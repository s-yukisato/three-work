const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const outputPath = path.resolve(__dirname, 'docs');

module.exports = {
    mode: "development",
    entry: './src/index.js',
    output: {
        path: outputPath,
        filename: 'bundle.js?[hash]' // バンドル後のファイル
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/sample.html',
            filename: 'index.html',
        })
    ],
    devtool: 'inline-source-map',
}