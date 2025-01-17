import { z } from 'zod';

import { Condition, ConditionFactory, number } from '../../condition';
import { TimeTriggerContext } from '../context';

function getSinceCreatedHours(ctx: TimeTriggerContext): number {
  const createdAt = ctx.getCreateDate();
  const ms = Date.now() - createdAt.getTime();
  return ms / 1000 / 60 / 60;
}

const factories: Record<string, ConditionFactory<any, TimeTriggerContext>> = {
  is: number.is(getSinceCreatedHours, 'hours since created'),
  gt: number.gt(getSinceCreatedHours, 'hours since created'),
  lt: number.lt(getSinceCreatedHours, 'hours since created'),
  gte: number.gte(getSinceCreatedHours, 'hours since created'),
  lte: number.lte(getSinceCreatedHours, 'hours since created'),
};

const schema = z.object({
  op: z.string(),
});

export default function (options: unknown): Condition<TimeTriggerContext> {
  const { op } = schema.parse(options);
  const factory = factories[op];
  if (!factory) {
    throw new Error('Unknown op: ' + op);
  }
  return factory(options);
}
