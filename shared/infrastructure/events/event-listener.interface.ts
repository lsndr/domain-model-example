import { IEventConstructor } from '../../domain';

export const EVENT_LISTENER_PROVIDER = Symbol.for('EVENT_LISTENER_PROVIDER');

export type EventHandler<E> = (event: E) => void | Promise<void>;

export type EventHandlerOptions = {
  exclusive?: true;
  ack?: 'AUTOMATIC' | 'ON_SUCCESS' | 'ON_FINISH';
};

export interface IEventListener {
  register<C extends IEventConstructor<any>>(
    event: C,
    handler: EventHandler<InstanceType<C>>,
    options?: EventHandlerOptions,
  ): Promise<void>;

  unregister<C extends IEventConstructor<any>>(
    event: C,
    handler: EventHandler<InstanceType<C>>,
  ): Promise<void>;
}
