/* global config, path */

module.exports = function(grunt) {
	grunt.registerTask('runValidation', function() {
		var scripts = grunt.file.expand({
				cwd: config.paths.jsSource,
				filter: function(src) {
					return src.indexOf('/polyfill') === -1 &&
						src.indexOf('.min.js') === -1 &&
						src.indexOf('/vendor') === -1;
				}
			}, '**/*.js');

		// Validate scripts
		scripts.forEach(function(scriptPath) {
			var script = path.join(config.paths.jsSource, scriptPath);
			Wee.validate(config, grunt, script, false);
		});
	});
};