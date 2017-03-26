import { $exec } from '../core/core';
import { $isFunction, $isObject } from '../core/types';
import { $each, $map, $parseHTML, $sel, $setRef } from '../core/dom';

/**
 * Get class value of element
 *
 * @private
 * @param {HTMLElement} el
 * @returns {string}
 */
function _getClass(el) {
	return el instanceof SVGElement ?
		el.getAttribute('class') :
		el.className;
}

/**
 * Set class value of element
 *
 * @private
 * @param {HTMLElement} el
 * @param {string} className
 */
function _setClass(el, className) {
	el instanceof SVGElement ?
		el.setAttribute('class', className) :
		el.className = className;
}

/**
 * Add classes to each matching selection
 *
 * @param {($|HTMLElement|string)} target
 * @param {(function|string)} value
 */
export function $addClass(target, value) {
	let func = $isFunction(value);

	$each(target, (el, i) => {
		let cn = _getClass(el),
			name = func ?
				$exec(value, {
					args: [i, cn],
					scope: el
				}) :
				value;

		if (name) {
			let names = cn.split(' '),
				upd = name.split(' ').filter(val => {
					return names.indexOf(val) < 0;
				});

			upd.unshift(cn);

			_setClass(el, upd.join(' '));
		}
	});
}

/**
 * Insert selection or markup after each matching selection
 *
 * @param {($|HTMLElement|string)} target
 * @param {($|function|HTMLElement|string)} source
 * @param {boolean} [remove=false]
 */
export function $after(target, source, remove) {
	const func = $isFunction(source);

	$each(target, (el, i) => {
		let aft = func ?
			$exec(source, {
				args: [i, el.innerHTML],
				scope: el
			}) :
			source;

		if (typeof aft == 'string') {
			aft = $parseHTML(aft);
		}

		if (aft) {
			let par = el.parentNode;

			$each(aft, cel => {
				if (i > 0) {
					cel = $clone(cel)[0];
				}

				par.insertBefore(cel, el.nextSibling);

				$setRef(par);
			}, {
				reverse: true
			});
		}

		if (remove) {
			$remove(el);
		}
	});
}

/**
 * Append selection or markup after each matching selection
 *
 * @param {($|HTMLElement|string)} target
 * @param {($|function|HTMLElement|string)} source
 */
export function $append(target, source) {
	let func = $isFunction(source);

	$each(target, (el, i) => {
		let app = func ?
			$exec(source, {
				args: [i, el.innerHTML],
				scope: el
			}) :
			source;

		if (typeof app == 'string') {
			app = $parseHTML(app);
		}

		if (app) {
			$each(app, cel => {
				el.appendChild(cel);
			});

			$setRef(el);
		}
	});
}

/**
 * Get attribute of first matching selection or set attribute
 * of each matching selection
 *
 * @param {($|HTMLElement|string)} target
 * @param a
 * @param b
 * @returns {(string|undefined)}
 */
export function $attr(target, a, b) {
	let obj = $isObject(a);

	if (b !== undefined || obj) {
		let func = ! obj && $isFunction(b);

		$each(target, function(el, i) {
			obj ?
				Object.keys(a).forEach(function(key) {
					el.setAttribute(key, a[key]);
				}) :
				el.setAttribute(a, func ?
					$exec(b, {
						args: [i, el],
						scope: el
					}) :
					b
				);
		});
	} else {
		return $sel(target)[0].getAttribute(a);
	}
}

/**
 * Clone each matching selection
 *
 * @param {($|HTMLElement|string)} target
 * @returns {Array}
 */
export function $clone(target) {
	return $map(target, el => {
		return el.cloneNode(true);
	});
}

/**
 * Remove each matching selection from the document
 *
 * @param {($|HTMLElement|string)} target
 * @param {($|HTMLElement|string)} [context=document]
 */
export function $remove(target, context) {
	let arr = [];

	$each(target, el => {
		let par = el.parentNode;

		arr.push(el);

		par.removeChild(el);

		$setRef(par);
	}, {
		context: context
	});

	return arr;
}