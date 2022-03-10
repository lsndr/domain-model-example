import { connect, Connection } from 'amqplib';
import { IEvent, IEventConstructor } from '../../domain';

export interface EventDto<E> {
  name: string;
  payload: E;
}

export function isEventDto<
  E extends IEvent<E>,
  C extends IEventConstructor<E, { new (...args: any): E }>,
>(dto: any, event: C): dto is EventDto<E> {
  return typeof dto === 'object' && dto !== null && dto.name === event.name;
}

export const RABBITMQ_PROVIDER = Symbol.for('RABBITMQ_PROVIDER');

export function rabbitmqFactory(): Promise<Connection> {
  if (typeof process.env.RABBITMQ_URL === 'undefined') {
    throw new Error('RABBITMQ_URL is required');
  }

  return connect(process.env.RABBITMQ_URL);
}
