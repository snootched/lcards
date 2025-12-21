const path = require('path');

module.exports = {
    entry: './src/lcards.js',
    output: {
        filename: 'lcards.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: 'auto',
        chunkFilename: '[name].[contenthash:8].js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    // Enable code splitting optimization
    optimization: {
        splitChunks: {
            chunks: 'async',
            cacheGroups: {
                // Default vendor chunk for large libraries
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    devtool: 'source-map',
    cache: false,
};