import { expect } from 'chai';
import { observable, action } from 'mobx';
import { innerHTML } from '../../tools/utils';
import observer from '../observer';
import Inferno, { render } from 'inferno';
Inferno; // suppress ts 'never used' error

describe('MobX observer()', () => {
	let container;

	beforeEach(() => {
		container = document.createElement('div') as HTMLElement;
		container.style.display = 'none';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
		render(null, container);
	});

	// We don't have this optimization from React, so this test is mute (also unfinished)
	it.skip('should render parent only when updating store (batched Update)', () => {

		const store = observable({
			view: {
				path: 'A',
				name: 'Look at me!'
			}
		});

		const handleClick = action(() => {
			store.view = { path: 'B', name: null };
		});

		const ChildA = observer(function ChildA() {
			// should not render!
			return (
				<div>
					<h2>{store.view.name}</h2>
					<button onClick={handleClick}>Go to child B</button>
				</div>
			);
		});

		const ChildB = function ChildB() {
			return <h2>I am child B!</h2>;
		};

		const Parent = observer(function Parent() {
			// should render!
			switch (store.view.path) {
				case 'A':
					return <ChildA/>;
				case 'B':
					return <ChildB/>;
				default:
					return null;
			}
		});

		render(<Parent/>, container);
		handleClick();
		expect(container.innerHTML).to.equal(innerHTML('<h2>I am child B!</h2>'));
	});

});
