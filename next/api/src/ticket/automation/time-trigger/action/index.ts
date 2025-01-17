import { z } from 'zod';

import { Action, ActionFactory } from '../../action';
import updateCategoryId from '../../action/updateCategoryId';
import updateAssigneeId from '../../action/updateAssigneeId';
import updateGroupId from '../../action/updateGroupId';
import closeTicket from '../../action/closeTicket';

const factories: Record<string, ActionFactory<unknown>> = {
  updateAssigneeId,
  updateCategoryId,
  updateGroupId,
  closeTicket,
};

const schema = z.object({
  type: z.string(),
});

export function action(options: unknown): Action {
  const { type } = schema.parse(options);
  const factory = factories[type];
  if (!factory) {
    throw new Error('Unknown type: ' + type);
  }
  return factory(options);
}
