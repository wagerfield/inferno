const rollup = require('rollup').rollup;
const path = require('path');
const package = require('./package.json');
const typescript = require('rollup-plugin-typescript');
const filesize = require('rollup-plugin-filesize');
const buble = require('rollup-plugin-buble');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');

const entry = path.resolve('src/index.ts');
const plugins = [
	typescript({
		typescript: require('typescript')
	}),
	buble({
		objectAssign: 'Object.assign'
	}),
	// relativeModules(),
	commonjs({
		include: 'node_modules/**',
		exclude: ['node_modules/symbol-observable/**', '**/*.css']
	}),
	filesize()
];

if (process.env.NODE_ENV === 'production') {
	plugins.push(
		uglify({
			warnings: false,
			compress: {
				screw_ie8: true,
				dead_code: true,
				unused: true,
				drop_debugger: true, //
				booleans: true // various optimizations for boolean context, for example !!a ? b : c → a ? b : c
			},
			mangle: {
				screw_ie8: true
			}
		})
	);
	plugins.push(
		replace({
			VERSION: package.version,
			'process.env.NODE_ENV': JSON.stringify('production')
		})
	)
}

const dependencies = Object.keys(package.peerDependencies || {}).concat(Object.keys(package.dependencies || {}));
const external = dependencies.concat(Object.keys(package.dependencies || {}));
const dest = path.resolve(`dist/inferno.${ process.env.NODE_ENV === 'production' ? 'min.js' : 'js' }`);
const copyright =
	'/*!\n' +
	' * inferno v' + package.version + '\n' +
	' * (c) ' + new Date().getFullYear() + ' ' + package.author.name + '\n' +
	' * Released under the ' + package.license + ' License.\n' +
	' */';
const bundleConfig = {
		dest,
		format: 'umd',
		moduleName: 'Inferno',
		globals: {
			moduleGlobal: 'Inferno'
		},
		banner: copyright,
		sourceMap: false
};

rollup({ entry, plugins, external }).then(({ write }) => write(bundleConfig)).catch(err => {
	console.error(err);
});
