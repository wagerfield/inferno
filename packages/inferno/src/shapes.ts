import { isUndefined } from './common';
import {
	NodeTypes,
	ChildrenTypes
} from './constants';
import {
	OptVElement,
	StaticVElement,
	OptBlueprint,
	IProps,
	VComponent,
	VElement,
	VFragment,
	VPlaceholder,
	VType
} from '../../../shared/shapes';

export function createOptVElement(bp, key, v0, v1, v2, v3): OptVElement {
	return {
		bp,
		dom: null,
		key,
		type: NodeTypes.OPT_ELEMENT,
		v0,
		v1,
		v2,
		v3
	};
}

export function createOptBlueprint(staticVElement: StaticVElement, v0, d0, v1, d1, v2, d2, v3, d3, renderer): OptBlueprint {
	const bp: OptBlueprint = {
		clone: null,
		svgClone: null,
		d0,
		d1,
		d2,
		d3,
		pools: {
			nonKeyed: [],
			keyed: new Map<string | number, OptVElement>()
		},
		staticVElement,
		type: NodeTypes.OPT_BLUEPRINT,
		v0,
		v1,
		v2,
		v3
	};
	if (renderer) {
		renderer.createStaticVElementClone(bp, false);
	}
	return bp;
}

export function createVComponent(component: any, props: IProps, key?, hooks?, ref?): VComponent {
	return {
		component,
		dom: null,
		hooks: hooks || null,
		instance: null,
		key,
		props,
		ref: ref || null,
		type: NodeTypes.COMPONENT
	};
}

export function createVText(text) {
	return {
		dom: null,
		text,
		type: NodeTypes.TEXT
	};
}

export function createVElement(tag, props: IProps, children, key, ref, childrenType): VElement {
	return {
		children,
		childrenType: childrenType || ChildrenTypes.UNKNOWN,
		dom: null,
		key,
		props,
		ref: ref || null,
		tag,
		type: NodeTypes.ELEMENT
	};
}

export function createStaticVElement(tag, props: IProps, children): StaticVElement {
	return {
		children,
		props,
		tag,
		type: NodeTypes.ELEMENT
	};
}

export function createVFragment(children, childrenType): VFragment {
	return {
		children,
		childrenType: childrenType || ChildrenTypes.UNKNOWN,
		dom: null,
		pointer: null,
		type: NodeTypes.FRAGMENT
	};
}

export function createVPlaceholder(): VPlaceholder {
	return {
		dom: null,
		type: NodeTypes.PLACEHOLDER
	};
}

export function isVElement(o: VType): boolean {
	return o.type === NodeTypes.ELEMENT;
}

export function isOptVElement(o: VType): boolean {
	return o.type === NodeTypes.OPT_ELEMENT;
}

export function isVComponent(o: VType): boolean {
	return o.type === NodeTypes.COMPONENT;
}

export function isVText(o: VType): boolean {
	return o.type === NodeTypes.TEXT;
}

export function isVFragment(o: VType): boolean {
	return o.type === NodeTypes.FRAGMENT;
}

export function isVPlaceholder(o: VType): boolean {
	return o.type === NodeTypes.PLACEHOLDER;
}

export function isVNode(o: VType): boolean {
	return !isUndefined(o.type);
}
