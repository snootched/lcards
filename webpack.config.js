const path = require('path');

module.exports = {
    entry: './src/lcards.js',
    output: {
        filename: 'lcards.js',
        path: path.resolve(__dirname, 'dist'),
        // Public path for dynamic imports - will be auto-detected at runtime
        publicPath: 'auto',
        // Enable code splitting for async chunks
        chunkFilename: '[name].[contenthash:8].js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
            },
            // Add loader for Monaco Editor CSS
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            // Add loader for Monaco Editor fonts
            {
                test: /\.ttf$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash:8][ext]'
                }
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
                // Monaco Editor core
                monaco: {
                    test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
                    name: 'monaco-editor',
                    priority: 20,
                    reuseExistingChunk: true,
                },
                // Monaco YAML worker
                monacoYaml: {
                    test: /[\\/]node_modules[\\/]monaco-yaml[\\/]/,
                    name: 'monaco-yaml',
                    priority: 20,
                    reuseExistingChunk: true,
                },
                // Default vendor chunk for other large libraries
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