import router from 'wee-routes';
import { RouteHandler } from 'wee-routes';

const basicRoutes = [
	{
		path: '/',
		handler() {
			//
		}
	},
	{
		path: '/about',
		handler() {
			//
		}
	}
];

const testUri = 'https://www.weepower.com:9000/scripts?foo=bar&baz=qux#hash';

function setPath(path) {
	window.history.pushState({}, 'Title', path);
}

describe('Router', () => {
	describe('map', () => {
		beforeEach(router.reset);

		it('should accept an array of objects', () => {
			router.map(basicRoutes);

			expect(router.routes(null, 'list').length).to.equal(2);
		});

		it('should not overwrite existing path object', () => {
			router().map([
					{ path: '/', handler: 'old handler' }
				])
				.map(basicRoutes);

			let routes = router().routes();

			expect(Object.keys(routes).length).to.equal(2);
			expect(routes['/'].handler).to.equal('old handler');
			expect(routes['/about'].path).to.equal('/about');
		});

		it('should map nested children routes', () => {
			router().map(basicRoutes)
				.map([
					{
						path: '/parent/:id',
						handler: () => {},
						children: [
							{ path: 'child', handler: 'I am a child' },
							{ path: 'child2', handler: 'I am a second child' }
						]
					}
				]);

			const list = router().routes(null, 'list');
			const routes = router().routes();

			// Verify mapping objects are correct
			expect(Object.keys(routes).length).to.equal(5);
			expect(routes['/parent/:id/child']).to.be.an('object');
			expect(routes['/parent/:id/child'].path).to.equal('/parent/:id/child');
			expect(routes['/parent/:id/child'].handler).to.equal('I am a child');

			// Verify that order of mapping of child routes is correct
			expect(list[2]).to.equal('/parent/:id/child');
			expect(list[3]).to.equal('/parent/:id/child2');
			expect(list[4]).to.equal('/parent/:id');
		});

		it('should map by route name if provided', () => {
			router().map([
					{
						name: 'home',
						path: '/',
						handler: 'this is the home route handler'
					},
					{
						name: 'parent',
						path: '/parent/:id',
						handler: () => {},
						children: [
							{ name: 'child', path: 'child', handler: 'I am a child' }
						]
					}
				]);

				let routes = router().routes(null, 'name');

				expect(routes.home.path).to.equal('/');
				expect(routes.parent.path).to.equal('/parent/:id');
				expect(routes.child.path).to.equal('/parent/:id/child');
		});

		it('should prepend / if route has no parent', () => {
			router().map([
				{ path: 'something', handler: () => {} }
			]);

			expect(router().routes()['/something'].path).to.equal('/something');
		});
	});

	describe('routes', () => {
		afterEach(router().reset);

		it('should return route path mapping', () => {
			router.map(basicRoutes);

			expect(router.routes()).to.be.an('object');
			expect(router.routes()['/'].path).to.equal('/');
		});

		it('should return the route with specific path', () => {
			router.map(basicRoutes);

			expect(router.routes(null, 'list').length).to.equal(2);
			expect(router.routes('/')).to.be.an('object');
			expect(router.routes('/about').path).to.equal('/about');
		});

		it('should return the route with specific name', () => {
			router.map([{ path: '/other', name: 'test', handler: () => {} }].concat(basicRoutes));

			expect(router.routes('test').path).to.equal('/other');
		});

		it('should return the route name mapping', () => {
			router.map([{ path: '/other', name: 'test', handler: () => {} }].concat(basicRoutes));

			const nameMap = router.routes(null, 'name');

			expect(nameMap).to.be.an('object');
			expect(nameMap.test.path).to.equal('/other');
		});

		it('should return the route path list', () => {
			router.map(basicRoutes);

			expect(router.routes(null, 'list')).to.deep.equal(['/', '/about']);
		});
	});

	describe('run', () => {
		let state = false;
		let stateArray = [];

		afterEach(() => {
			router().reset();
			state = false;
			stateArray = [];
		});

		it('should match one route', () => {

		});

		it('should match child route before parent route', () => {
			router.map(basicRoutes.concat([
				{
					path: '/parent/*',
					handler: () => state = 'parent',
					children: [
						{ path: 'child', handler: () => state = 'child' }
					]
				}
			]));

			expect(state).to.equal('child');
		});

		describe('before hooks', () => {
			it('should evaluate before hook of matched route record', () => {
				setPath('/');

				router().map([
					{
						path: '/',
						before(to, from, next) {
							state = 'home';
							next();
						}
					},
					{
						path: '*',
						before(to, from, next) {
							state = 'catch all';
							next();
						}
					}
				]);

				expect(state).to.equal('home');
			});

			it('should resolve before hooks asynchronously', done => {
				setPath('/test');

				router.map([
					{
						path: '/test',
						beforeInit(to, from, next) {
							setTimeout(() => {
								state = true;
								next();
							}, 250);
						}
					}
				]);

				setTimeout(() => {
					expect(state).to.be.true;
					done();
				}, 300);
			});

			it('should evaluate beforeEach hook(s) before route record is evaluated', () => {
				// TODO: Write test
			});

			it('should evaluate parent before hooks before children route records', () => {
				// TODO: Write test
			});

			it('should stop processing of routes if false is passed to "next"', () => {
				setPath('/');
				let beforeState = 0;
				let initState = 0;

				router().map([
					{
						path: '/',
						beforeInit(to, from, next) {
							beforeState += 1;
							next(false);
						},
						init() {
							initState += 1;
						}
					},
					{
						path: '*',
						beforeInit(to, from, next) {
							beforeState += 1;
							next();
						},
						beforeUpdate() {

						}
					}
				]);

				expect(beforeState).to.equal(1);
				// TODO: Ensure test stops processing of init when init callbacks are processing
				expect(initState).to.equal(0);
			});
		});

		// it('should not resolve before hook if "next" is not executed', () => {
		// 	setPath('/');
		// 	state = false;
		//
		// 	router().map([
		// 		{
		// 			path: '/',
		// 			before(to, from, next) {
		// 				setTimeout(() => {
		// 					state = true;
		// 				}, 1000);
		// 			}
		// 		}
		// 	]);
		//
		// 	expect(state).to.be.false;
		// });

		// it('should evaluate handler of matching routes', () => {
		// 	setPath('/');
		// 	router().map([
		// 		{
		// 			path: '/',
		// 			handler() {
		// 				state = true;
		// 			}
		// 		}
		// 	]);
		//
		// 	expect(state).to.equal(true);
		// });

		// it('should parse url variable parameters and pass to handler', () => {
		// 	setPath('/blog/5');
		// 	router().map([
		// 		{
		// 			path: '/blog/:id',
		// 			handler(params) {
		// 				state = true;
		// 				expect(params.id).to.equal(5);
		// 			}
		// 		}
		// 	]);
		//
		// 	expect(state).to.equal(true);
		// });

		// it('should pass multiple url variables as an object to handler', () => {
		// 	setPath('/blog/tech/2017/10/5/blog-title');
		// 	router().map([
		// 		{
		// 			path: '/blog/:category/:year/:month/:day/:slug',
		// 			handler(params) {
		// 				expect(params.category).to.equal('tech');
		// 				expect(params.year).to.equal(2017);
		// 				expect(params.month).to.equal(10);
		// 				expect(params.day).to.equal(5);
		// 				expect(params.slug).to.equal('blog-title');
		// 			}
		// 		}
		// 	]);
		// });
	//
	// 	it('should evaluate wildcard routes and run handlers accordingly', () => {
	// 		setPath('/test/test2/3');
	// 		router().map([
	// 			{
	// 				path: '/test/*',
	// 				handler(params) {
	// 					expect(params[0]).to.equal('test2/3');
	// 					stateArray.push(1);
	// 				}
	// 			},
	// 			{
	// 				path: '/test/*/:id',
	// 				handler(params) {
	// 					expect(params[0]).to.equal('test2');
	// 					expect(params.id).to.equal(3);
	// 					stateArray.push(2);
	// 				}
	// 			}
	// 		]);
	//
	// 		expect(stateArray.length).to.equal(2);
	// 	});
	//
		it('should create and maintain "current" object', () => {
			const handler = function() {};
			setPath('/path/to/stuff?key=value&key2=value2#hash');

			router().map([
				{ name: 'home', path: '/path/to/:place', handler: handler, meta: {test: 'meta'} }
			]);

			expect(router.currentRoute()).to.deep.equal({
				name: 'home',
				meta: {test: 'meta'},
				path: '/path/to/stuff',
				hash: 'hash',
				query: {key: 'value', key2: 'value2'},
				params: {place: 'stuff'},
				segments: ['path', 'to', 'stuff'],
				full: '/path/to/stuff?key=value&key2=value2#hash',
				matches: [
					{
						before: undefined,
						handler: handler,
						init: undefined,
						update: undefined,
						after: undefined,
						unload: undefined,
						pop: undefined,
						meta: {test: 'meta'},
						name: 'home',
						parent: undefined,
						path: '/path/to/:place',
						processed: true,
						regex: /^\/path\/to\/((?:[^\/]+?))(?:\/(?=$))?$/i
					}
				]
			});
		});
	//
	// 	describe('handler', () => {
	// 		beforeEach(() => {
	// 			router().map(basicRoutes);
	// 		});
	// 		afterEach(router().reset);
	//
	// 		it('should accept function', () => {
	// 			let state = false;
	//
	// 			setPath('/accepts/function');
	// 			router().map([
	// 				{
	// 					path: '/accepts/function',
	// 					handler() {
	// 						state = true;
	// 					}
	// 				}
	// 			]);
	//
	// 			expect(state).to.be.true;
	// 		});
	//
	// 		it('should accept RouteHandler', () => {
	// 			let state = false;
	//
	// 			setPath('/accepts/route-handler');
	// 			router().map([
	// 				{
	// 					path: '/accepts/route-handler',
	// 					handler: new RouteHandler({
	// 						init() {
	// 							state = true;
	// 						}
	// 					})
	// 				}
	// 			]);
	//
	// 			expect(state).to.be.true;
	// 		});
	//
	// 		it('should accept array with mixture of functions/RouteHandler', () => {
	// 			let state = false;
	//
	// 			setPath('/accepts/mixture');
	// 			router().map([
	// 				{
	// 					path: '/accepts/mixture',
	// 					handler: [
	// 						() => {
	// 							state = 'anonymous function';
	// 							expect(state).to.equal('anonymous function');
	// 						},
	// 						new RouteHandler({
	// 							init() {
	// 								state = 'route handler';
	// 								expect(state).to.equal('route handler');
	// 							}
	// 						}),
	// 						() => {
	// 							state = 'last';
	// 							expect(state).to.equal('last');
	// 						}
	// 					]
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal('last');
	// 		});
	//
	// 		it('should be evaluated every time route matches', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('filter', () => {
	// 		it('should use filter to determine handler execution', () => {
	// 			setPath('/test');
	// 			router().map([
	// 				{
	// 					path: '/test',
	// 					handler() {
	// 						state = true;
	// 					},
	// 					filter: function() {
	// 						return false;
	// 					}
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal(false);
	// 		});
	//
	// 		it('should use registered filter to determine handler execution', () => {
	// 			setPath('/test');
	// 			router().addFilter('test', () => {
	// 				return false;
	// 			}).map([
	// 				{
	// 					path: '/test',
	// 					handler() {
	// 						state = true;
	// 					},
	// 					filter: 'test'
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal(false);
	// 		});
	//
	// 		it('should use registered filters to determine handler execution', () => {
	// 			setPath('/test');
	// 			router().addFilter({
	// 				filterOne() {
	// 					return false;
	// 				},
	// 				filterTwo() {
	// 					return false;
	// 				}
	// 			}).map([
	// 				{
	// 					path: '/test',
	// 					handler() {
	// 						state = true;
	// 					},
	// 					filter: ['filterOne', 'filterTwo']
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal(false);
	// 		});
	//
	// 		it('should not execute handler and stop filter evaluation if one filter evaluates false', () => {
	// 			setPath('/test');
	// 			router().addFilter({
	// 				filterOne() {
	// 					return false;
	// 				},
	// 				filterTwo() {
	// 					state = true;
	// 					return true;
	// 				}
	// 			}).map([
	// 				{
	// 					path: '/test',
	// 					handler() {
	// 						state = true;
	// 					},
	// 					filter: ['filterOne', 'filterTwo']
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal(false);
	// 		});
	//
	// 		it('should pass params and current URI to filters', () => {
	// 			setPath('/test/2');
	// 			router().addFilter({
	// 				filter: function(params, uri) {
	// 					expect(params.id).to.equal(2);
	// 					expect(uri.full).to.equal('/test/2');
	// 					return true;
	// 				}
	// 			}).map([
	// 				{
	// 					path: '/test/:id',
	// 					handler() {
	// 						state = true;
	// 					},
	// 					filter: 'filter'
	// 				}
	// 			]);
	//
	// 			expect(state).to.equal(true);
	// 		});
	// 	});
	//
	// 	describe('init', () => {
	// 		it('should be a function', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should execute when route is first matched', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('update', () => {
	// 		it('should be a function', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should execute if route has already been processed', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('beforeInit', () => {
	// 		it('should be a function', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should execute before navigating to matched route', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should have "to", "from", and "next" parameters', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should require "next" to be executed for navigation to occur', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('beforeUpdate', () => {
	// 		it('should be a function', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should execute before navigating to destination URL if route has been matched once before', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should have "to", "from", and "next" parameters', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should require "next" to be executed for navigation to occur', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('unload', () => {
	// 		it('should execute when leaving a route', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should execute a callback function as value', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should accept an object with resources to unload and custom "handler" callback', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should unload all resources under namespace', () => {
	// 			// TODO: Write test
	// 		});
	// 	});
	//
	// 	describe('route handler', () => {
	// 		it('should should be an instance of RouteHandler', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		it('should enforce interface', () => {
	// 			// TODO: Write test
	// 		});
	//
	// 		describe('init', () => {
	// 			it('should be a function', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should execute when route handler is first processed', () => {
	// 				// TODO: Write test
	// 			});
	// 		});
	//
	// 		describe('update', () => {
	// 			it('should be a function', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should execute if route handler has already been processed', () => {
	// 				// TODO: Write test
	// 			});
	// 		});
	//
	// 		describe('beforeInit', () => {
	// 			it('should be a function', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should execute before navigating to destination URL', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should have "to", "from", and "next" parameters', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should require "next" to be executed for navigation to occur', () => {
	// 				// TODO: Write test
	// 			});
	// 		});
	//
	// 		describe('beforeUpdate', () => {
	// 			it('should be a function', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should execute before navigating to destination URL if route handler has already been initialized', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should have "to", "from", and "next" parameters', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should require "next" to be executed for navigation to occur', () => {
	// 				// TODO: Write test
	// 			});
	// 		});
	//
	// 		describe('unload', () => {
	// 			it('should execute when leaving a route', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should execute a callback function as value', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should accept an object with resources to unload and custom "handler" callback', () => {
	// 				// TODO: Write test
	// 			});
	//
	// 			it('should unload all resources under namespace', () => {
	// 				// TODO: Write test
	// 			});
	// 		});
	// 	});
	});

	describe('segments', () => {
		afterEach(router().reset);

		it('should return the current path as an array of it\'s segments', () => {
			setPath('/one/two/three/four');

			expect(router().segments()).to.be.an('array');
			expect(router().segments().length).to.equal(4);
			expect(router().segments()[0]).to.equal('one');
			expect(router().segments()[1]).to.equal('two');
			expect(router().segments()[2]).to.equal('three');
			expect(router().segments()[3]).to.equal('four');
		});

		it('should return the segment by index of the current path', () => {
			setPath('/one/two/three/four');

			expect(router().segments(0)).to.equal('one');
			expect(router().segments(1)).to.equal('two');
			expect(router().segments(2)).to.equal('three');
			expect(router().segments(3)).to.equal('four');
		});
	});

	describe('uri', () => {
		before(() => {
			router().map(basicRoutes);
			setPath('/test2?foo=bar&baz=qux#hash');
		});
		after(router().reset);

		it('should return the hash', () => {
			expect(router().uri().hash).to.equal('hash');
		});

		it('should return the full path', () => {
			expect(router().uri().full).to.equal('/test2?foo=bar&baz=qux#hash');
		});

		it('should return the path', () => {
			expect(router().uri().path).to.equal('/test2');
		});

		it('should return the query', () => {
			expect(router().uri().query).to.be.an('object');
			expect(router().uri().query).to.include.keys(['foo', 'baz']);
			expect(router().uri().query.foo).to.equal('bar');
			expect(router().uri().query.baz).to.equal('qux');
		});

		it('should return an array of segments', () => {
			setPath('/test2/foo/bar/baz');

			expect(router().uri().segments).to.be.an('array');
			expect(router().uri().segments[0]).to.equal('test2');
			expect(router().uri().segments[1]).to.equal('foo');
			expect(router().uri().segments[2]).to.equal('bar');
			expect(router().uri().segments[3]).to.equal('baz');
		});

		it('should return the full url', () => {
			expect(router().uri().url).to.equal(window.location.href);
		});

		describe('parse', () => {
			it('should parse a given url', () => {
				const result = router().uri(testUri);
				expect(result).to.be.an('object');
			});

			it('should return the hash', () => {
				const result = router().uri(testUri);
				expect(result.hash).to.equal('hash');
			});

			it('should return the full path', () => {
				const result = router().uri(testUri);
				expect(result.full).to.equal('/scripts?foo=bar&baz=qux#hash');
			});

			it('should return the path', () => {
				const result = router().uri(testUri);
				expect(result.path).to.equal('/scripts');
			});

			it('should return the query', () => {
				const result = router().uri(testUri);
				expect(result.query).to.be.an('object');
				expect(result.query).to.include.keys(['foo']);
				expect(result.query.foo).to.equal('bar');
				expect(result.query).to.include.keys(['baz']);
				expect(result.query.baz).to.equal('qux');
			});

			it('should return an array of segments', () => {
				const result = router().uri(testUri);
				expect(result.segments).to.be.an('array');
				expect(result.segments[0]).to.equal('scripts');
			});

			it('should return the full url', () => {
				const result = router().uri(testUri);
				expect(result.url).to.equal('https://www.weepower.com:9000/scripts?foo=bar&baz=qux#hash');
			});
		});
	});
});