import { IEventConstructor } from '../../domain/events';
import {
  IEventListener,
  EventHandler,
  EventHandlerOptions,
} from './event-listener.interface';
import { Channel, Connection } from 'amqplib';
import { isEventDto } from './rabbitmq';

export type Handler = (event: any) => void | Promise<void>;

export class EventListener implements IEventListener {
  private handlers: Map<IEventConstructor<any>, Map<EventHandler<any>, string>>;

  private constructor(private readonly channel: Channel) {
    this.handlers = new Map();
  }

  async register<C extends IEventConstructor<any>>(
    event: C,
    handler: EventHandler<InstanceType<C>>,
    options?: EventHandlerOptions,
  ): Promise<void> {
    let eventHandlers = this.handlers.get(event);

    if (typeof eventHandlers === 'undefined') {
      eventHandlers = new Map();
      this.handlers.set(event, eventHandlers);
    }

    const consumerTag = eventHandlers.get(handler);

    if (typeof consumerTag !== 'undefined') {
      throw new Error(
        `Handler is already registered for ${event.name}. Consumer tag is ${consumerTag}`,
      );
    }

    const routingKey = `${event.channel}.${event.name}`;

    const queue = await this.channel.assertQueue(
      options?.exclusive ? routingKey : '',
      {
        durable: !!options?.exclusive,
        autoDelete: !options?.exclusive,
      },
    );

    await this.channel.bindQueue(queue.queue, 'domain', routingKey);

    const consumer = await this.channel.consume(
      queue.queue,
      (message) => {
        if (!message) {
          return;
        }

        const dto = JSON.parse(message.content.toString());

        if (!isEventDto(dto, event)) {
          console.error('Unexpected event', dto);
          return;
        }

        const eventInstance = new event(dto.payload);

        Promise.resolve(handler(eventInstance))
          .then(() => {
            if (options?.ack === 'ON_SUCCESS') {
              this.channel.ack(message);
            }
          })
          .catch((e) => {
            console.error(e);

            if (options?.ack === 'ON_SUCCESS') {
              this.channel.nack(message);
            }
          })
          .finally(() => {
            if (options?.ack === 'ON_FINISH') {
              this.channel.ack(message);
            }
          });
      },
      {
        noAck: !options?.ack || options.ack === 'AUTOMATIC',
      },
    );

    eventHandlers.set(handler, consumer.consumerTag);
  }

  async unregister<C extends IEventConstructor<any>>(
    event: C,
    handler: EventHandler<InstanceType<C>>,
  ): Promise<void> {
    const eventHandlers = this.handlers.get(event);

    if (typeof eventHandlers === 'undefined') {
      return;
    }

    const consumerTag = eventHandlers.get(handler);

    if (typeof consumerTag !== 'undefined') {
      await this.channel.cancel(consumerTag);
      eventHandlers.delete(handler);
    }
  }

  static async create(connection: Connection): Promise<EventListener> {
    const channel = await connection.createChannel();
    await channel.assertExchange('domain', 'direct', {
      durable: true,
    });

    return new this(channel);
  }
}
