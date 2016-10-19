
export interface IProps {
	[index: string]: any;
}
export interface VType {
	type: number;
}

export type InfernoInput = InfernoElement | InfernoElement[] | null | string | number;
export type InfernoElement = VElement | VComponent;

export interface VPlaceholder extends VType {
	dom: null | Node | SVGAElement;
}

export interface VFragment extends VPlaceholder {
	pointer: any;
	children: string | null | number | Array<any>;
	childrenType: number;
}

export interface StaticVElement {
	children: string | null | number | Array<any>;
	tag: string;
	props: IProps;
	type: number;
}

export interface OptBlueprint {
	clone: null | Node;
	svgClone: null | SVGAElement;
	d0: any;
	d1: any;
	d2: any;
	d3: Array<any>;
	pools: {
		nonKeyed: Array<OptBlueprint>;
		keyed: Map<string | number, OptVElement>;
	};
	staticVElement;
	type: number;
	v0: any;
	v1: any;
	v2: any;
	v3: Array<any>;
}

export interface OptVElement extends VPlaceholder {
	bp: OptBlueprint;
	key: string | number | null;
	v0: any;
	v1: any;
	v2: any;
	v3: Array<any>;
}

export interface VComponent extends VPlaceholder {
	component: Function | null;
	hooks: any;
	instance: null | Object;
	key: null | string | number;
	props: IProps;
	ref: Function | null;
}

export interface VElement extends VPlaceholder {
	children: string | null | number | Array<any>;
	childrenType: number;
	key: null | string | number;
	props: IProps;
	ref: Function | null;
	tag: string;
}

export interface Root {
	dom: Node | SVGAElement;
	input: InfernoInput;
}

export interface Pools {
  nonKeyed: Array<VComponent>;
  keyed: Map<string | number, Array<VComponent>>;
}
