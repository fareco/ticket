import { z } from 'zod';

import { Context } from '@/ticket/automation';
import { ConditionFactory } from '.';
import { not, string } from './common';

const getTitle = (ctx: Context) => ctx.ticket.title;

const is = string.eq(getTitle, 'title');
const includes = string.includes(getTitle, 'title');
const includesAny = string.includesAny(getTitle, 'title');
const includesAll = string.includesAll(getTitle, 'title');
const startsWith = string.startsWith(getTitle, 'title');
const endsWith = string.endsWith(getTitle, 'title');

const conditionFactories: Record<string, ConditionFactory> = {
  is,
  isNot: not(is),
  includes,
  notIncludes: not(includes),
  includesAny,
  notIncludesAny: not(includesAny),
  includesAll,
  notIncludesAll: not(includesAll),
  startsWith,
  endsWith,
};

const schema = z.object({
  op: z.string(),
});

export function title(options: unknown) {
  const { op } = schema.parse(options);
  if (op in conditionFactories) {
    return conditionFactories[op](options);
  }
  throw new Error('Unknown op: ' + op);
}