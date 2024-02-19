import { get, writable, type Readable } from 'svelte/store';

export type StateMachineContext = object;
export type StateId = string;

export type StateOnEnter<Id extends StateId, Context extends StateMachineContext> = (
	last: State<Id, Context>,
	context: Context,
	transition: StateMachineTransition<Id, Context>
) => Partial<Context>;

export type StateRun<Id extends StateId, Context extends StateMachineContext> = (
	context: Context,
	transition: StateMachineTransition<Id, Context>
) => Partial<Context>;

export type StateOnExit<Id extends StateId, Context extends StateMachineContext> = (
	next: State<Id, Context>,
	context: Context,
	transition: StateMachineTransition<Id, Context>
) => Partial<Context>;

export interface State<Id extends StateId, Context extends StateMachineContext> {
	id: Id;
	onEnter: StateOnEnter<Id, Context>;
	run: StateRun<Id, Context>;
	onExit: StateOnExit<Id, Context>;
}

export type StateMachineTransition<Id extends StateId, Context extends StateMachineContext> = (
	next: State<Id, Context>
) => void;

export interface StateMachine<Id extends StateId, Context extends StateMachineContext> {
	state: Readable<State<Id, Context>>;
	context: Readable<Context>;
	transition: StateMachineTransition<Id, Context>;
	run: () => void;
}

export type StateOptions<Id extends StateId, Context extends StateMachineContext> = Pick<
	State<Id, Context>,
	'id'
> &
	Partial<Omit<State<Id, Context>, 'id'>>;

export const createState = <Id extends StateId, Context extends StateMachineContext>({
	id,
	onEnter = (_, context) => context,
	run = (context) => context,
	onExit = (_, context) => context
}: StateOptions<Id, Context>) => {
	return { id, onEnter, run, onExit };
};

export const createStateMachine = <Id extends StateId, Context extends StateMachineContext>(
	initialState: State<Id, Context>,
	initialContext: Context
): StateMachine<Id, Context> => {
	const state = writable<State<Id, Context>>(initialState);
	const context = writable<Context>(initialContext);

	const transition = (next: State<Id, Context>) => {
		const last = get(state);
		let data = get(context);

		data = {
			...data,
			...last.onExit?.(next, data, transition)
		};

		context.set(data);
		state.set(next);

		data = {
			...data,
			...next.onEnter?.(last, data, transition)
		};

		context.set(data);
	};

	const run = () => {
		const current = get(state);
		let data = get(context);

		data = {
			...data,
			...current.run(data, transition)
		};

		context.set(data);
	};

	return { state, context, transition, run };
};
