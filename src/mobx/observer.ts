import Component from 'inferno-component';
import createClass from 'inferno-create-class';
import { Atom, Reaction, extras } from 'mobx';
import inject from './inject';
import { throwError } from '../shared';
import EventEmitter from './EventEmitter';

let isDevtoolsEnabled = false;
let isUsingStaticRendering = false;

// WeakMap<Node, Object>;
export const componentByNodeRegistery = typeof WeakMap !== "undefined" ? new WeakMap() : undefined;
export const renderReporter = new EventEmitter();

function reportRendering(component) {
	const node = component._vNode.dom;
	if (node && componentByNodeRegistery) {
		componentByNodeRegistery.set(node, component);
	}

	renderReporter.emit({
		event: 'render',
		renderTime: component.__$mobRenderEnd - component.__$mobRenderStart,
		totalTime: Date.now() - component.__$mobRenderStart,
		component,
		node
	});
}

export function trackComponents() {
	if (typeof WeakMap === 'undefined') {
		throwError('[inferno-mobx] tracking components is not supported in this browser.');
	}
	if (!isDevtoolsEnabled) {
		isDevtoolsEnabled = true;
	}
}

interface IReactiveRender {
	$mobx?: Reaction;
	(nextProps, nextContext): void;
}

export function useStaticRendering(useStaticRendering) {
	isUsingStaticRendering = useStaticRendering;
}

/**
 * Utilities
 */

function patch(target, funcName, runMixinFirst = false) {
	const base = target[funcName];
	const mixinFunc = reactiveMixin[funcName];
	if (!base) {
		target[funcName] = mixinFunc;
	} else {
		target[funcName] = runMixinFirst === true
			? function() {
			mixinFunc.apply(this, arguments);
			base.apply(this, arguments);
		}
			: function() {
			base.apply(this, arguments);
			mixinFunc.apply(this, arguments);
		};
	}
}

function isObjectShallowModified(prev, next) {
	if (null === prev || null === next || typeof prev !== "object" || typeof next !== "object") {
		return prev !== next;
	}
	const keys = Object.keys(prev);
	if (keys.length !== Object.keys(next).length) {
		return true;
	}
	for (let i in keys) {
		const key = keys[i];
		if (next[key] !== prev[key]) {
			return true;
		}
	}
	return false;
}

/**
 * ReactiveMixin
 */
const reactiveMixin = {
	componentWillMount() {
		if (isUsingStaticRendering === true) {
			return;
		}
		// Generate friendly name for debugging
		const initialName = this.displayName
			|| this.name
			|| (this.constructor && (this.constructor.displayName || this.constructor.name))
			|| "<component>";
		const rootNodeID = this._reactInternalInstance && this._reactInternalInstance._rootNodeID;

		/**
		 * If props are shallowly modified, react will render anyway,
		 * so atom.reportChanged() should not result in yet another re-render
		 */
		let skipRender = false;
		/**
		 * forceUpdate will re-assign this.props. We don't want that to cause a loop,
		 * so detect these changes
		 */
		let isForcingUpdate = false;

		function makePropertyObservableReference(propName) {
			let valueHolder = this[propName];
			const atom = new Atom("reactive " + propName);
			Object.defineProperty(this, propName, {
				configurable: true, enumerable: true,
				get() {
					atom.reportObserved();
					return valueHolder;
				},
				set: function set(v) {
					if (!isForcingUpdate && isObjectShallowModified(valueHolder, v)) {
						valueHolder = v;
						skipRender = true;
						atom.reportChanged();
						skipRender = false;
					} else {
						valueHolder = v;
					}
				}
			});
		}

		// make this.props an observable reference, see #124
		makePropertyObservableReference.call(this, "props");
		// make state an observable reference
		makePropertyObservableReference.call(this, "state");

		// wire up reactive render
		const baseRender = this.render.bind(this);
		let reaction = null;
		let isRenderingPending = false;

		const initialRender = (nextProps, nextContext) => {
			reaction = new Reaction(`${initialName}#${rootNodeID}.render()`, () => {
				if (!isRenderingPending) {
					// N.B. Getting here *before mounting* means that a component constructor has side effects (see the relevant test in misc.js)
					// This unidiomatic React usage but React will correctly warn about this so we continue as usual
					// See #85 / Pull #44
					isRenderingPending = true;
					if (typeof this.componentWillReact === "function") {
						this.componentWillReact(); // TODO: wrap in action?
					}
					if (this.__$mobxIsUnmounted !== true) {
						// If we are unmounted at this point, componentWillReact() had a side effect causing the component to unmounted
						// TODO: remove this check? Then react will properly warn about the fact that this should not happen? See #73
						// However, people also claim this migth happen during unit tests..
						let hasError = true;
						try {
							isForcingUpdate = true;
							if (!skipRender) {
								Component.prototype.forceUpdate.call(this);
							}
							hasError = false;
						} finally {
							isForcingUpdate = false;
							if (hasError) {
								reaction.dispose();
							}
						}
					}
				}
			});
			reactiveRender.$mobx = reaction;
			this.render = reactiveRender;
			return reactiveRender(nextProps, nextContext);
		};

		const reactiveRender: IReactiveRender = (nextProps, nextContext) => {
			isRenderingPending = false;
			let rendering = undefined;
			reaction.track(() => {
				if (isDevtoolsEnabled) {
					this.__$mobRenderStart = Date.now();
				}
				rendering = extras.allowStateChanges(false, baseRender.bind(this, nextProps, nextContext));
				if (isDevtoolsEnabled) {
					this.__$mobRenderEnd = Date.now();
				}
			});
			return rendering;
		};

		this.render = initialRender;
	},

	componentWillUnmount() {
		if (isUsingStaticRendering === true) {
			return;
		}
		this.render.$mobx && this.render.$mobx.dispose();
		this.__$mobxIsUnmounted = true;
		if (isDevtoolsEnabled) {
			const node = this._vNode.dom;
			if (node && componentByNodeRegistery) {
				componentByNodeRegistery.delete(node);
			}
			renderReporter.emit({
				event: 'destroy',
				component: this,
				node
			});
		}
	},

	componentDidMount() {
		if (isDevtoolsEnabled) {
			reportRendering(this);
		}
	},

	componentDidUpdate() {
		if (isDevtoolsEnabled) {
			reportRendering(this);
		}
	},

	shouldComponentUpdate(nextProps, nextState) {
		if (isUsingStaticRendering) {
			console.warn("[inferno-mobx] It seems that a re-rendering of a component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side.");
		}
		// update on any state changes (as is the default)
		if (this.state !== nextState) {
			return true;
		}
		// update if props are shallowly not equal, inspired by PureRenderMixin
		// we could return just 'false' here, and avoid the `skipRender` checks etc
		// however, it is nicer if lifecycle events are triggered like usually,
		// so we return true here if props are shallowly modified.
		return isObjectShallowModified(this.props, nextProps);
	}
};

/**
 * Observer function / decorator
 */
export default function observer(arg1, arg2?) {
	if (typeof arg1 === "string") {
		throw new Error("Store names should be provided as array");
	}
	if (Array.isArray(arg1)) {
		if (!arg2) {
			// invoked as decorator
			return componentClass => observer(arg1, componentClass);
		} else {
			return inject.apply(null, arg1)(observer(arg2));
		}
	}
	const componentClass = arg1;

	if (componentClass.isMobxInjector === true) {
		console.warn('Mobx observer: You are trying to use \'observer\' on a component that already has \'inject\'. Please apply \'observer\' before applying \'inject\'');
	}

	// Stateless function component:
	// If it is function but doesn't seem to be an inferno class constructor,
	// wrap it to a react class automatically
	if (
		typeof componentClass === "function" &&
		(!componentClass.prototype || !componentClass.prototype.render) && !Component.isPrototypeOf(componentClass)
	) {

		return observer(createClass({
			displayName: componentClass.displayName || componentClass.name,
			propTypes: componentClass.propTypes,
			contextTypes: componentClass.contextTypes,
			getDefaultProps() { return componentClass.defaultProps; },
			render() { return componentClass.call(this, this.props, this.context); }
		}));
	}

	if (!componentClass) {
		throw new Error("Please pass a valid component to 'observer'");
	}

	const target = componentClass.prototype || componentClass;
	mixinLifecycleEvents(target);
	componentClass.isMobXReactObserver = true;
	return componentClass;
}

function mixinLifecycleEvents(target) {
	patch(target, "componentWillMount", true);
	[
		"componentDidMount",
		"componentWillUnmount",
		"componentDidUpdate"
	].forEach(function(funcName) {
		patch(target, funcName);
	});
	if (!target.shouldComponentUpdate) {
		target.shouldComponentUpdate = reactiveMixin.shouldComponentUpdate;
	}
}

// TODO: support injection somehow as well?
export const Observer = observer(({ children }) => children());

Observer.propTypes = {
	children() {}
};
