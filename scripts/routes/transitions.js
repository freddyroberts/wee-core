import { $each } from 'core/dom';
import { _doc } from 'core/variables';
import { _slice } from 'core/types';
import { $addClass, $removeClass } from 'dom/index';
import { warn } from './warn';

/**
 * Detect what transition property to listen for
 *
 * @returns {*}
 * @private
 */
function _whichTransitionEvent() {
	const el = document.createElement('meta');
	const animations = {
		'transition': 'transitionend',
		'OTransition': 'oTransitionEnd',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	};

	for (let t in animations) {
		if (el.style[t] !== undefined){
			return animations[t];
		}
	}
}

const transitionEvent = _whichTransitionEvent();

export default class Transition {
	constructor(config) {
		this.transitionEvent = transitionEvent;
		this.elements = config.target ? _slice.call(_doc.querySelectorAll(config.target)) : [];
		this.class = config.class || null;
		this.enterCallback = config.enter || null;
		this.leaveCallback = config.leave || null;
		this.timeout = config.timeout || null;
		this.countEvents = null;
		this.completed = 0;
	}
	enter(to, from) {
		if (this.class) {
			if (! this.elements.length) {
				warn('no elements found - cannot apply enter transition');
			}

			this.elements.forEach((el) => {
				el.removeEventListener(this.transitionEvent, this.countEvents);
				$removeClass(el, this.class);
			});
		}

		if (this.enterCallback) {
			this.enterCallback(to, from);
		}
	}
	leave(to, from) {
		const scope = this;

		return new Promise((resolve, reject) => {
			if (this.class) {
				if (! this.elements.length) {
					warn('no elements found - cannot apply leave transition');
					return resolve(scope);
				}

				this.countEvents = function countEvents() {
					scope.completed += 1;

					if (scope.elements.length === scope.completed) {
						resolve(scope);
					}
				};

				// Add class to targets
				$each(this.elements, (el) => {
					el.addEventListener(this.transitionEvent, this.countEvents);

					$addClass(el, this.class);
				});
			} else if (this.leaveCallback) {
				this.leaveCallback(to, from, (error) => {
					if (error) {
						return reject(error);
					}

					resolve(scope);
				});
			}

			if (this.timeout) {
				setTimeout(() => {
					resolve(scope);
				}, this.timeout);
			}
		});
	}
}