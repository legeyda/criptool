const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const path = require('path');



module.exports = function (env: string) {
	const define_process = {
		emitWarning: true,
		env: {
			NODE_DEBUG: ('production' != env)
		}
	}

	const dist_dir = path.resolve(__dirname, 'production' == env ? 'dist' : 'build')
	return {
		entry: './src/index.tsx',
		output: { 
			path: dist_dir,
			filename: 'bundle.js',
			publicPath: '' 
		},
		devtool: 'inline-source-map',
		devServer: {},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
			fallback: {
				buffer: require.resolve('buffer/')
			},
			alias: {
				stream: 'stream-browserify',
				criptool: path.resolve(__dirname, "./src"),
			}
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: './src/index.html',
				filename: path.resolve(dist_dir, 'criptool.html'),
				inlineSource: '.(js|css)$'
			}),
			new HtmlInlineScriptPlugin(),
			new webpack.ProvidePlugin({
				Buffer: ['buffer', 'Buffer'],

			}),
			new webpack.DefinePlugin({
				 // process: define_process,
				'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
				'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
				'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
			}),
			new webpack.IgnorePlugin({
				checkResource(resource) {
					return /.*\/wordlists\/(?!english).*\.json/.test(resource)
				}
			})
		],
	}
};