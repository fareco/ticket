import React, { memo, useMemo } from 'react'
import { Button, Form, Breadcrumb } from 'react-bootstrap'
import SelectSearch, { fuzzySearch } from 'react-select-search'
import { withTranslation } from 'react-i18next'
import { withRouter, Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import { db } from '../../lib/leancloud'
import { depthFirstSearchFind } from '../../lib/common'
import { getCategoriesTree } from '../common'
import CategoriesSelect from '../CategoriesSelect'
import { GroupSelect } from '../components/Group'
import Select from 'modules/components/Select'
import { useTicketFormList } from './TicketForm'
import { useAppContext } from 'modules/context'

import styles from './Category.module.scss'

// 应该用 seaach select 这里不搞这个了
const FormSelect = memo(({ value, onChange }) => {
  const { addNotification } = useAppContext()
  const {
    data: [forms],
  } = useTicketFormList(0, 100, {
    onError: (error) => addNotification(error),
  })
  const options = useMemo(() => forms.map((form) => [form.id, form.title]), [forms])
  return <Select value={value} options={options} onChange={onChange} placeholder="" />
})

function renderFAQ(props, option, snapshot, className) {
  return (
    <button {...props} className={className} type="button">
      <span>{option.fullName}</span>
    </button>
  )
}

class Category extends React.Component {
  constructor() {
    super()
    this.state = {
      name: '',
      description: '',
      qTemplate: '',
      FAQs: [],
      assignedGroupId: '',
      category: undefined,
      parentCategory: undefined,
      categoriesTree: undefined,
      isSubmitting: false,
      isLoading: true,
      form: undefined,
      allFAQs: [],
    }
  }

  componentDidMount() {
    getCategoriesTree()
      .then((categoriesTree) => {
        this.setState({ categoriesTree, isLoading: false })

        const categoryId = this.props.match.params.id
        if (categoryId == '_new') {
          return
        }
        const category = depthFirstSearchFind(categoriesTree, (c) => c.id == categoryId)

        this.setState({
          category,
          name: category.get('name'),
          description: category.get('description'),
          qTemplate: category.get('qTemplate'),
          assignedGroupId: category.get('group')?.id,
          parentCategory: category.get('parent'),
          FAQs: (category.get('FAQs') || []).map((FAQ) => FAQ.id),
          form: category.get('form') ? category.get('form').id : undefined,
        })
        return
      })
      .catch(this.context.addNotification)
    db.class('FAQ')
      .find()
      .then((FAQs) => {
        this.setState({ allFAQs: FAQs })
        return
      })
      .catch(this.context.addNotification)
  }

  handleNameChange(e) {
    this.setState({ name: e.target.value })
  }
  handleDescriptionChange(e) {
    this.setState({ description: e.target.value })
  }
  handleFAQsChange(selectedFAQIds) {
    this.setState({ FAQs: selectedFAQIds })
  }

  handleParentChange(t, e) {
    const parentCategory = depthFirstSearchFind(
      this.state.categoriesTree,
      (c) => c.id == e.target.value
    )
    let tmp = parentCategory
    while (tmp) {
      if (this.state.category && tmp.id == this.state.category.id) {
        alert(t('parentCategoryRequirements'))
        return false
      }
      tmp = tmp.parent
    }
    this.setState({
      parentCategory: depthFirstSearchFind(
        this.state.categoriesTree,
        (c) => c.id == e.target.value
      ),
    })
  }

  handleQTemplateChange(e) {
    this.setState({ qTemplate: e.target.value })
  }
  handleAssignedGroupIdChange(e) {
    this.setState({ assignedGroupId: e.target.value })
  }

  handleFromIdChange(id) {
    this.setState({ form: id })
  }

  handleSubmit(e) {
    e.preventDefault()
    this.setState({ isSubmitting: true })
    const category = this.state.category
    const FAQs = this.state.FAQs.map((id) => db.class('FAQ').object(id))

    let promise

    if (!category) {
      promise = db.class('Category').add({
        name: this.state.name,
        description: this.state.description,
        parent: this.state.parentCategory,
        qTemplate: this.state.qTemplate,
        FAQs,
        form: this.state.form ? db.class('TicketForm').object(this.state.form) : undefined,
      })
    } else {
      const data = { qTemplate: this.state.qTemplate, FAQs }

      if (this.state.parentCategory != category.parent) {
        if (!this.state.parentCategory) {
          data.parent = db.op.unset()
        } else {
          data.parent = this.state.parentCategory
        }
      }
      if (this.state.assignedGroupId != category.get('group')?.id) {
        if (!this.state.assignedGroupId) {
          data.group = db.op.unset()
        } else {
          data.group = db.class('Group').object(this.state.assignedGroupId)
        }
      }

      if (this.state.name != category.get('name')) {
        data.name = this.state.name
      }
      if (this.state.description != category.get('description')) {
        data.description = this.state.description
      }
      if (this.state.form != category.get('form')?.id) {
        if (!this.state.form) {
          data.form = db.op.unset()
        } else {
          data.form = db.class('TicketForm').object(this.state.form)
        }
      }
      promise = category.update(data)
    }

    promise
      .then(() => {
        this.setState({ isSubmitting: false })
        this.props.history.push('/settings/categories')
        return
      })
      .then(this.context.addNotification)
      .catch(this.context.addNotification)
  }

  handleDisable(t) {
    const result = confirm(t('confirmDisableCategory') + this.state.category.get('name'))
    if (result) {
      this.state.category
        .update({
          deletedAt: new Date(),
          order: new Date().getTime(), // 确保在排序的时候尽量靠后
        })
        .then(() => {
          this.props.history.push('/settings/categories')
          return
        })
        .catch(this.context.addNotification)
    }
  }

  render() {
    const { t } = this.props
    if (this.state.isLoading) {
      return <div>{t('loading')}……</div>
    }

    const FAQOptions = this.state.allFAQs.map((FAQ) => ({
      value: FAQ.id,
      name: `${FAQ.get('archived') ? '（已归档）' : ''}${FAQ.get('question').slice(0, 12)}${
        FAQ.get('question').length > 12 ? '...' : ''
      }`,
      fullName: `${FAQ.get('archived') ? '（已归档）' : ''}${FAQ.get('question')}`,
    }))
    console.log(FAQOptions)

    return (
      <Form onSubmit={this.handleSubmit.bind(this)}>
        <Breadcrumb>
          <Breadcrumb.Item linkProps={{ to: '/settings/categories' }} linkAs={Link}>
            {t('category')}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {this.state.category?.id ? this.state.category.id : t('add')}
          </Breadcrumb.Item>
        </Breadcrumb>
        <Form.Group controlId="nameText">
          <Form.Label>{t('categoryName')}</Form.Label>
          <Form.Control value={this.state.name} onChange={this.handleNameChange.bind(this)} />
        </Form.Group>
        <Form.Group controlId="descriptionText">
          <Form.Label>
            {t('categoryDescription')}
            {t('optional')}
          </Form.Label>
          <Form.Control
            value={this.state.description}
            onChange={this.handleDescriptionChange.bind(this)}
          />
        </Form.Group>
        <Form.Group controlId="parentSelect">
          <Form.Label>
            {t('parentCategory')}
            {t('optional')}
          </Form.Label>
          <CategoriesSelect
            categoriesTree={this.state.categoriesTree}
            selected={this.state.parentCategory}
            onChange={this.handleParentChange.bind(this, t)}
          />
        </Form.Group>
        {process.env.ENABLE_FAQ && (
          <Form.Group controlId="FAQsText">
            <Form.Label>
              {t('FAQ')}
              {t('optional')}
            </Form.Label>
            <SelectSearch
              className={classnames('select-search', styles.formSelect)}
              closeOnSelect={false}
              printOptions="on-focus"
              multiple
              placeholder="Select your items"
              value={this.state.FAQs}
              onChange={this.handleFAQsChange.bind(this)}
              options={FAQOptions}
              renderOption={renderFAQ}
              filterOptions={fuzzySearch}
            />
            {/* <Form.Control
              value={this.state.FAQs}
              onChange={this.handleFAQsChange.bind(this)}
              placeholder="objectId1,objectId2"
            /> */}
            <Form.Text>{t('FAQInfo')}</Form.Text>
          </Form.Group>
        )}
        {process.env.ENABLE_BUILTIN_DESCRIPTION_TEMPLATE && (
          <Form.Group controlId="qTemplateTextarea">
            <Form.Label>
              {t('ticket.template')}
              {t('optional')}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows="8"
              value={this.state.qTemplate}
              onChange={this.handleQTemplateChange.bind(this)}
            />
            <Form.Text>{t('ticket.templateInfo')}</Form.Text>
          </Form.Group>
        )}
        <Form.Group controlId="groupSelect">
          <Form.Label>
            {t('assignToGroup')}
            {t('optional')}
          </Form.Label>
          <GroupSelect
            value={this.state.assignedGroupId}
            onChange={this.handleAssignedGroupIdChange.bind(this)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>
            {t('assignToTicketTemplate')}
            {t('optional')}
          </Form.Label>
          <FormSelect value={this.state.form} onChange={this.handleFromIdChange.bind(this)} />
        </Form.Group>
        <Button type="submit" disabled={this.state.isSubmitting} variant="success">
          {t('save')}
        </Button>{' '}
        {this.state.category && (
          <Button variant="danger" onClick={this.handleDisable.bind(this, t)}>
            {t('disable')}
          </Button>
        )}{' '}
        <Button variant="light" onClick={() => this.props.history.push('/settings/categories')}>
          {t('return')}
        </Button>
      </Form>
    )
  }
}

Category.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  t: PropTypes.func,
}

Category.contextTypes = {
  addNotification: PropTypes.func.isRequired,
}

export default withTranslation()(withRouter(Category))
