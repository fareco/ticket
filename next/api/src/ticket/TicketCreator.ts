import _ from 'lodash';

import events from '@/events';
import { ACLBuilder } from '@/orm';
import htmlify from '@/utils/htmlify';
import { Category } from '@/model/Category';
import { Group } from '@/model/Group';
import { OpsLogCreator } from '@/model/OpsLog';
import { Organization } from '@/model/Organization';
import { Ticket } from '@/model/Ticket';
import { FieldValue, TicketFieldValue } from '@/model/TicketFieldValue';
import { User, systemUser } from '@/model/User';

export class TicketCreator {
  private author?: User;
  private organization?: Organization;
  private category?: Category;
  private title?: string;
  private content?: string;
  private contentHTML?: string;
  private fileIds?: string[];
  private metaData?: Record<string, any>;
  private customFields?: FieldValue[];
  private assignee?: User;
  private group?: Group;

  private aclBuilder: ACLBuilder;

  constructor() {
    this.aclBuilder = new ACLBuilder().allowCustomerService('read', 'write').allowStaff('read');
  }

  setAuthor(author: User): this {
    this.author = author;
    this.aclBuilder.allow(author, 'read', 'write');
    return this;
  }

  setOrganization(organization: Organization): this {
    this.organization = organization;
    this.aclBuilder.allowOrgMember(organization, 'read', 'write');
    return this;
  }

  setCategory(category: Category): this {
    this.category = category;
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setContent(content: string): this {
    this.content = content;
    this.contentHTML = htmlify(content);
    return this;
  }

  setFileIds(fileIds: string[]): this {
    if (fileIds.length) {
      this.fileIds = fileIds;
    }
    return this;
  }

  setMetaData(metaData: Record<string, any>): this {
    this.metaData = metaData;
    return this;
  }

  setCustomFields(customFields: FieldValue[]): this {
    if (customFields.length) {
      this.customFields = customFields;
    }
    return this;
  }

  setAssignee(assignee: User): this {
    this.assignee = assignee;
    return this;
  }

  setGroup(group: Group): this {
    this.group = group;
    return this;
  }

  check(): boolean {
    return !!(this.author && this.category && this.title && this.content && this.contentHTML);
  }

  private async selectAssignee() {
    if (this.assignee) return;

    let category = this.category;
    if (!category) {
      throw new Error('The category is required for select assignee');
    }

    const customerServices = await User.getCustomerServicesOnDuty();
    if (customerServices.length === 0) {
      return;
    }

    while (category) {
      const categoryId = category.id;
      const candidates = customerServices.filter((u) => u.categoryIds?.includes(categoryId));
      if (candidates.length) {
        this.setAssignee(_.sample(candidates)!);
        break;
      }
      if (!category.parentId) {
        break;
      }
      category = await category.load('parent');
    }
  }

  private async selectGroup() {
    if (this.group) return;

    let category = this.category;
    if (!category) {
      throw new Error('The category is required for select group');
    }

    while (category) {
      if (category.groupId) {
        const group = await category.load('group', { useMasterKey: true });
        if (group) {
          this.setGroup(group);
        }
        break;
      }
      if (!category.parentId) {
        break;
      }
      category = await category.load('parent');
    }
  }

  private async saveCustomFields(ticket: Ticket) {
    if (!this.customFields) {
      return;
    }
    await TicketFieldValue.create(
      {
        ACL: {},
        ticketId: ticket.id,
        values: this.customFields,
      },
      { useMasterKey: true }
    );
  }

  private assignRelatedInstance(ticket: Ticket) {
    ticket.author = this.author;
    ticket.organization = this.organization;
    ticket.assignee = this.assignee;
    ticket.group = this.group;
  }

  private async createOpsLogs(ticket: Ticket) {
    const olc = new OpsLogCreator(ticket);
    if (this.assignee) {
      olc.selectAssignee(this.assignee);
    }
    if (this.group) {
      olc.changeGroup(this.group, systemUser);
    }
    await olc.create();
  }

  async create(operator: User): Promise<Ticket> {
    if (!this.check()) {
      throw new Error('Missing some required attributes');
    }

    try {
      await this.selectAssignee();
    } catch (error) {
      // TODO: Sentry
      console.error('[ERROR] Select assignee failed:', error);
    }
    try {
      await this.selectGroup();
    } catch (error) {
      // TODO: Sentry
      console.error('[ERROR] Select group failed:', error);
    }

    const ticket = await Ticket.create(
      {
        ACL: this.aclBuilder.toJSON(),
        authorId: this.author!.id,
        organizationId: this.organization?.id,
        category: this.category,
        title: this.title,
        content: this.content,
        contentHTML: this.contentHTML,
        fileIds: this.fileIds,
        metaData: this.metaData,
        assigneeId: this.assignee?.id,
        groupId: this.group?.id,
        status: Ticket.STATUS.NEW,
      },
      {
        ...operator.getAuthOptions(),
        ignoreBeforeHook: true,
        ignoreAfterHook: true,
      }
    );

    try {
      await this.saveCustomFields(ticket);
    } catch (error) {
      // TODO: Sentry
      console.error('[ERROR] Save custom field failed, error:', error);
    }

    this.assignRelatedInstance(ticket);

    this.createOpsLogs(ticket).catch((error) => {
      // TODO: Sentry
      console.error('[ERROR] save OpsLog failed, error:', error);
    });

    events.emit('ticket:created', {
      ticket: ticket.toJSON(),
      currentUserId: operator.id,
    });

    return ticket;
  }
}
