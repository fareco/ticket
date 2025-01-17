import { z } from 'zod';

import { User } from '@/model/User';
import { Condition, ConditionFactory, not } from '../../condition';
import { TriggerContext } from '../context';

const isCustomerService: Condition<TriggerContext> = {
  name: 'current user is customer service',
  test: (ctx) => {
    return User.isCustomerService(ctx.currentUserId);
  },
};

const is: ConditionFactory<string, TriggerContext> = (value) => {
  if (value === '__customerService') {
    return isCustomerService;
  }
  return {
    name: `current user is ${value}`,
    test: (ctx) => {
      return ctx.currentUserId === value;
    },
  };
};

const factories: Record<string, ConditionFactory<string, TriggerContext>> = {
  is,
  isNot: not(is),
};

const schema = z.object({
  op: z.string(),
  value: z.string(),
});

export default function (options: unknown): Condition<TriggerContext> {
  const { op, value } = schema.parse(options);
  const factory = factories[op];
  if (!factory) {
    throw new Error('Unknown op: ' + op);
  }
  return factory(value);
}
