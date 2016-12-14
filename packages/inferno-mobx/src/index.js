import Provider from '../../../build/mobx/Provider';
import {trackComponents, renderReporter, componentByNodeRegistery} from '../../../build/mobx/makeReactive';
import observer from '../../../build/mobx/observer';
import inject from '../../../build/mobx/inject';

export default {
	Provider,
	inject,
	observer,
	connect: observer,
	trackComponents,
	renderReporter,
	componentByNodeRegistery
};
