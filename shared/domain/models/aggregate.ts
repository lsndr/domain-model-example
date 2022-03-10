import { IEvent } from '../events';

export type AggregateProperties<I extends string = string> = {
  readonly id: I;
};

export abstract class Aggregate<I extends string = string> {
  readonly id: I;
  readonly events: IEvent<object>[];

  constructor(props: AggregateProperties<I>) {
    this.id = props.id;
    this.events = [];
  }

  addEvent(event: IEvent<object>) {
    this.events.push(event);
  }
}
