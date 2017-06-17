const fs = require('fs-extra');
const glob = require('glob');
const paths = require('../../../utils').paths;
const args = process.argv.filter(arg => arg.includes('--')).map(arg => {
	return arg.replace('--', '').split(/=| +/).map(word => word.trim());
});
let spec = args.find(arg => arg[0] === 'spec');
let reporters = ['mocha', 'coverage'];
let files = [];
let preprocessors = [];

spec = Array.isArray(spec) ? spec[1] : '';


function addFile(file) {
	files.push(file);
	preprocessors[file] = ['webpack'];
}

// Remove coverage if running specific spec file
// as it gets in the way and is inaccurate
if (spec.length) {
	reporters.pop();
	addFile(paths.tests.scripts + '/unit/' + spec);
} else {
	glob.sync(paths.tests.scripts + '/unit/**/*.js').forEach(file => console.error(file));
}

module.exports = {
	// list of files / patterns to load in the browser
	files,

	// Process files before serving to browser
	// karma-coverage not registered here because of babel-plugin-istanbul
	preprocessors,

	// frameworks to use
	// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	frameworks: ['mocha', 'chai'],
	webpackMiddleware: {
		noInfo: true
	},
	webpack: require('./webpack.config.js'),

	// Reporters
	reporters: reporters,
	mochaReporter: {
		showDiff: true
	},
	coverageReporter: {
		reporters: [
			{
				type: 'lcovonly',
				dir: '../../../coverage',
				subdir: '.'
			},
			{
				type: 'text'
			}
		]
	},

	// web server port
	protocol: 'http',
	port: 9876,
	httpsServerOptions: {
		// key: fs.readFileSync(resolve(__dirname, './https/server.key'), 'utf8'),
		// cert: fs.readFileSync(resolve(__dirname, './https/server.crt'), 'utf8')
	},

	// enable / disable colors in the output (reporters and logs)
	colors: true,

	// Concurrency level
	// how many browser should be started simultaneous
	concurrency: Infinity,

	// This is a hack to keep karma from re-running tests over and over
	browserNoActivityTimeout: 2000
};