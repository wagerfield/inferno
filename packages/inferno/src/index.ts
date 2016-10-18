import {
	createOptVElement,
	createOptBlueprint,
	createVElement,
	createStaticVElement,
	createVFragment,
	createVComponent,
	createVPlaceholder,
	createVText
} from './shapes';
import {
	ValueTypes,
	ChildrenTypes,
	NodeTypes
} from './constants';
import cloneVNode from './cloneVNode';
import { 
	NO_OP,
	isArray,
	toArray,
	isStatefulComponent,
	isStringOrNumber,
	isNullOrUndef,
	isInvalid,
	isFunction,
	isAttrAnEvent,
	isString,
	isNumber,
	isNull,
	isTrue,
	isUndefined,
	isObject,
	throwError,
	warning
} from './common';

if (typeof window !== 'undefined' && window.document) {
	window.process = {
		env: {
			NODE_ENV: 'development'
		}
	};
}

if (process.env.NODE_ENV !== 'production') {
	const testFunc = function testFn() {};
	warning(
		(testFunc.name || testFunc.toString()).indexOf('testFn') !== -1,
		'It looks like you\'re using a minified copy of the development build ' +
		'of Inferno. When deploying Inferno apps to production, make sure to use ' +
		'the production build which skips development warnings and is faster. ' +
		'See http://infernojs.org for more details.'
	);
}

export default {
	// JSX optimisations
	createOptVElement,
	createOptBlueprint,
	createStaticVElement,

	// core shapes
	createVElement,
	createVFragment,
	createVPlaceholder,
	createVComponent,
	createVText,

	// cloning
	cloneVNode,	

	// enums
	ValueTypes,
	ChildrenTypes,
	NodeTypes,

	// common
	NO_OP,
	isArray,
	toArray,
	isStatefulComponent,
	isStringOrNumber,
	isNullOrUndef,
	isInvalid,
	isFunction,
	isAttrAnEvent,
	isString,
	isNumber,
	isNull,
	isTrue,
	isUndefined,
	isObject,
	throwError,
	warning
};
