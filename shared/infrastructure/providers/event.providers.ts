import {
  EventDispatcher,
  EventListener,
  EVENT_DISPATCHER_PROVIDER,
  EVENT_LISTENER_PROVIDER,
  RABBITMQ_PROVIDER,
  rabbitmqFactory,
} from '../events';
import { Provider } from 'moject';
import { Connection } from 'amqplib';

export const eventProviders: Provider[] = [
  {
    identifier: EVENT_DISPATCHER_PROVIDER,
    useFactory: (connection: Connection) => {
      return EventDispatcher.create(connection);
    },
    inject: [RABBITMQ_PROVIDER],
  },
  {
    identifier: EVENT_LISTENER_PROVIDER,
    useFactory: (connection: Connection) => {
      return EventListener.create(connection);
    },
    inject: [RABBITMQ_PROVIDER],
  },
  {
    identifier: RABBITMQ_PROVIDER,
    useFactory: rabbitmqFactory,
  },
];
