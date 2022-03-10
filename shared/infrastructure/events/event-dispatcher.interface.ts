import { IEvent } from '../../domain';

export const EVENT_DISPATCHER_PROVIDER = Symbol.for(
  'EVENT_DISPATCHER_PROVIDER',
);

export interface IEventDispatcher {
  dispatch<E extends IEvent<E>>(event: E | E[]): Promise<void>;
}
