import {
	isBrowser
} from 'inferno';
import { render, findDOMNode, createRenderer } from './rendering';
import createStaticVElementClone from './createStaticVElementClone';
import { disableRecycling } from './recycling';
import { initDevToolsHooks }  from './devtools';

if (isBrowser) {
	initDevToolsHooks(window);
}

export default {
	render,
	findDOMNode,
	createRenderer,
	createStaticVElementClone,
	disableRecycling
};
