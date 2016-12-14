import { IProps } from '../core/shapes';
import createClass from 'inferno-create-class';
import createElement from 'inferno-create-element';
import hoistStatics from 'hoist-non-inferno-statics';
import observer from './observer';

interface IStoreProps extends IProps {
	ref: any;
}

const injectorContextTypes = {
	mobxStores() {
	}
};

Object.seal(injectorContextTypes);

const proxiedInjectorProps = {
	contextTypes: {
		get() {
			return injectorContextTypes;
		},
		set() {
			console.warn("Mobx Injector: you are trying to attach `contextTypes` on an component decorated with `inject` (or `observer`) HOC. Please specify the contextTypes on the wrapped component instead. It is accessible through the `wrappedComponent`");
		},
		configurable: true,
		enumerable: false
	},
	isMobxInjector: {
		value: true,
		writable: true,
		configurable: true,
		enumerable: true
	}
};

/**
 * Store Injection
 */
function createStoreInjector(grabStoresFn, component, injectNames?) {
	let displayName = "inject-" + (component.displayName || component.name || (component.constructor && component.constructor.name) || "Unknown");
	if (injectNames) {
		displayName += "-with-" + injectNames;
	}

	const Injector = createClass({
		displayName,
		storeRef(instance) {
			this.wrappedInstance = instance;
		},
		render() {
			// Optimization: it might be more efficient to apply the mapper function *outside* the render method
			// (if the mapper is a function), that could avoid expensive(?) re-rendering of the injector component
			// See this test: 'using a custom injector is not too reactive' in inject.js
			let newProps = <IStoreProps> {};
			for (let key in this.props) {
				if (this.props.hasOwnProperty(key)) {
					newProps[key] = this.props[key];
				}
			}
			const additionalProps = grabStoresFn(this.context.mobxStores || {}, newProps, this.context) || {};
			for (let key in additionalProps) {
				newProps[key] = additionalProps[key];
			}
			newProps.ref = this.storeRef;

			return createElement(component, newProps);
		}
	});

	hoistStatics(Injector, component);

	Injector.wrappedComponent = component;
	Object.defineProperties(Injector, proxiedInjectorProps);

	return Injector;
}

const grabStoresByName = (storeNames) => (baseStores, nextProps) => {
	storeNames.forEach(function(storeName) {

		// Prefer props over stores
		if (storeName in nextProps) {
			return;
		}

		if (!(storeName in baseStores)) {
			throw new Error(
				`MobX observer: Store "${storeName}" is not available! ` +
				`Make sure it is provided by some Provider`
			);
		}

		nextProps[storeName] = baseStores[storeName];
	});
	return nextProps;
};

/**
 * Higher order component that injects stores to a child.
 * takes either a varargs list of strings, which are stores read from the context,
 * or a function that manually maps the available stores from the context to props:
 * storesToProps(mobxStores, props, context) => newProps
 */
export default function inject(grabStoresFn?: Function | string) {

	if (typeof arguments[0] === "function") {
		grabStoresFn = arguments[0];

		return (componentClass) => {
			let injected = createStoreInjector(grabStoresFn, componentClass);
			injected.isMobxInjector = false; // supress warning
			// mark the Injector as observer, to make it react to expressions in `grabStoresFn`,
			// see #111
			injected = observer(injected);
			injected.isMobxInjector = true; // restore warning
			return injected;
		};

	} else {

		let storeNames = [];
		for (let i = 0; i < arguments.length; i++) {
			storeNames[i] = arguments[i];
		}
		grabStoresFn = grabStoresByName(storeNames);

		return (componentClass) => createStoreInjector(grabStoresFn, componentClass, storeNames.join("-"));
	}
}
