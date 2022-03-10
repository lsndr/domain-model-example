import { IEventDispatcher } from './event-dispatcher.interface';
import { IEventConstructor, IEvent } from '../../domain';
import { Channel, Connection } from 'amqplib';
import { EventDto } from './rabbitmq';

export class EventDispatcher implements IEventDispatcher {
  private constructor(private readonly channel: Channel) {}

  private isEventConstructor(
    eventConstructor: any,
  ): eventConstructor is IEventConstructor<IEvent<object>> {
    return (
      typeof eventConstructor === 'function' &&
      typeof eventConstructor.channel === 'string' &&
      typeof eventConstructor.name === 'string'
    );
  }

  async dispatch<E extends IEvent<E>>(event: E | E[]): Promise<void> {
    const events = Array.isArray(event) ? event : [event];

    for (let i = 0; i < events.length; i++) {
      const eventConstructor = events[i].constructor;

      if (!this.isEventConstructor(eventConstructor)) {
        console.warn('Event has an invalid constructor', events[i]);
        continue;
      }

      const eventDto: EventDto<E> = {
        name: eventConstructor.name,
        payload: events[i],
      };

      this.channel.publish(
        'domain',
        `${eventConstructor.channel}.${eventConstructor.name}`,
        Buffer.from(JSON.stringify(eventDto)),
        {
          persistent: true,
        },
      );
    }
  }

  static async create(connection: Connection): Promise<EventDispatcher> {
    const channel = await connection.createChannel();
    await channel.assertExchange('domain', 'direct', {
      durable: true,
    });

    return new this(channel);
  }
}
