/* global config, module, project */

module.exports = function(grunt) {
	grunt.registerTask('configStyle', function() {
		var features = project.style.core;

		// Core style features
		config.style.vars = {
			sourcePath: '"' + config.paths.cssSource + '"',
			modulePath: '"' + config.paths.modulesSource + '"',
			buttonEnabled: features.buttons === true,
			codeEnabled: features.code === true,
			formEnabled: features.forms === true,
			tableEnabled: features.tables === true,
			printEnabled: features.print === true
		};

		if (config.style.vars.codeEnabled) {
			config.style.imports.push('../style/components/wee.code.less');
		}

		if (config.style.vars.formEnabled) {
			config.style.imports.push('../style/components/wee.forms.less');
		}

		if (config.style.vars.buttonEnabled) {
			config.style.imports.push('../style/components/wee.buttons.less');
		}

		if (config.style.vars.tableEnabled) {
			config.style.imports.push('../style/components/wee.tables.less');
		}

		if (config.style.vars.printEnabled) {
			config.style.print = '@media print {\n';
			config.style.print += '@import "../style/wee.print.less";\n';
			config.style.print += '@import (optional) "@{sourcePath}/custom/print.less";\n';
			config.style.print += '}';
		}

		// Responsive
		if (features.responsive && features.responsive.enable === true) {
			config.style.vars.responsiveEnabled = true;
			config.style.vars.ieBreakpoint = project.style.legacy.breakpoint || 4;

			// Breakpoints
			var offset = features.responsive.offset || 0,
				breakpoints = features.responsive.breakpoints,
				defaults = [
					'mobileLandscape',
					'tabletPortrait',
					'desktopSmall',
					'desktopMedium',
					'desktopLarge'
				];

			defaults.forEach(function(key) {
				var breakpoint = breakpoints[key];

				config.style.vars[key + 'Width'] = breakpoint !== false ?
					(breakpoint - offset) + 'px' :
					false;

				delete breakpoints[key];
			});

			// Custom breakpoints
			Object.keys(breakpoints).forEach(function(key) {
				// TODO: Complete custom breakpoint feature
				if (breakpoints[key] !== false) {
					config.style.vars[key + 'Width'] = (
						breakpoints[key] - offset
					) + 'px';
				}
			});

			config.style.responsive = '@import "../style/wee.responsive.less";';
		} else {
			config.style.vars.responsiveEnabled = false;
			config.style.vars.ieBreakpoint = 1;
		}

		// Compile custom
		for (var target in project.style.compile) {
			var taskName = target.replace(/\./g, '-') + '-style',
				sources = Wee.$toArray(project.style.compile[target]),
				files = [];

			for (var sourcePath in sources) {
				files.push(Wee.buildPath(config.paths.cssSource, sources[sourcePath]));
			}

			// Set watch config
			grunt.config.set('watch.' + taskName, {
				files: files,
				tasks: [
					'less:' + taskName
				]
			});

			// Create Less task
			grunt.config.set('less.' + taskName, {
				files: [{
					dest: Wee.buildPath(config.paths.css, target),
					src: files
				}],
				options: {
					globalVars: {
						weePath: '"' + config.paths.weeTemp + '"'
					}
				}
			});

			// Push style task
			config.style.tasks.push('less:' + taskName);
		}

		// Set global data variables
		if (
			(project.data && Object.keys(project.data).length) ||
			(project.style.data && Object.keys(project.style.data).length)
		) {
			var configVars = Wee.$extend(project.data, project.style.data || {});

			for (var key in configVars) {
				var value = configVars[key];

				if (typeof value == 'string') {
					config.style.vars[key] = value;
				}
			}
		}
	});
};