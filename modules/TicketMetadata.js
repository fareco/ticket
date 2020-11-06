import _ from 'lodash'
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {FormGroup, FormControl, Button} from 'react-bootstrap'
import AV from 'leancloud-storage/live-query'

import {getCustomerServices, UserLabel, getCategoryPathName, CategoriesSelect, depthFirstSearchFind, TagForm} from './common'
import css from './Ticket.css'
import csCss from './CustomerServiceTickets.css'



class TicketMetadata extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isUpdateAssignee: false,
      isUpdateCategory: false,
      assignees: [],
    }
  }
  
  componentDidMount() {
    this.fetchDatas()
  }
  
  fetchDatas() {
    getCustomerServices()
      .then(assignees => {
        this.setState({assignees})
        return
      })
      .catch(this.context.addNotification)
  }
  
  handleAssigneeChange(e) {
    const customerService = _.find(this.state.assignees, {id: e.target.value})
    this.props.updateTicketAssignee(customerService)
      .then(() => {
        this.setState({isUpdateAssignee: false})
        return
      })
      .then(this.context.addNotification)
      .catch(this.context.addNotification)
  }
  
  handleCategoryChange(e) {
    this.props.updateTicketCategory(depthFirstSearchFind(this.props.categoriesTree, c => c.id == e.target.value))
      .then(() => {
        this.setState({isUpdateCategory: false})
        return
      })
      .then(this.context.addNotification)
      .catch(this.context.addNotification)
  }
  
  handleTagChange(key, value, isPrivate) {
    return this.props.saveTag(key, value, isPrivate)
  }
  
  render() {
    const {ticket, isCustomerService} = this.props
    return <div>
        <FormGroup>
          <label className="label-block">负责人</label>
          {this.state.isUpdateAssignee ?
            <FormControl componentClass='select' value={ticket.get('assignee').id} onChange={this.handleAssigneeChange.bind(this)}>
              {this.state.assignees.map((cs) => <option key={cs.id} value={cs.id}>{cs.get('username')}</option>)}
            </FormControl>
            :
            <span className={css.assignee}>
              <UserLabel user={ticket.get('assignee')} />
              {isCustomerService && 
                <Button bsStyle='link' onClick={() => this.setState({isUpdateAssignee: true})}>
                  <span className='glyphicon glyphicon-pencil' aria-hidden="true"></span>
                </Button>
              }
            </span>
          }
        </FormGroup>
        <FormGroup>
          <label className="label-block">类别</label>
          {this.state.isUpdateCategory ?
            <CategoriesSelect categoriesTree={this.props.categoriesTree}
              selected={ticket.get('category')}
              onChange={this.handleCategoryChange.bind(this)} />
            :
            <div>
              <span className={csCss.category + ' ' + css.categoryBlock}>
                {getCategoryPathName(ticket.get('category'), this.props.categoriesTree)}
              </span>
              {isCustomerService &&
                <Button bsStyle='link' onClick={() => this.setState({isUpdateCategory: true})}>
                  <span className='glyphicon glyphicon-pencil' aria-hidden="true"></span>
                </Button>
              }
            </div>
          }
        </FormGroup>
  
        {this.context.tagMetadatas.map(tagMetadata => {
          const tags = ticket.get(tagMetadata.get('isPrivate') ? 'privateTags' : 'tags')
          const tag = _.find(tags, t => t.key == tagMetadata.get('key'))
          return <TagForm key={tagMetadata.id}
                          tagMetadata={tagMetadata}
                          tag={tag}
                          changeTagValue={this.handleTagChange.bind(this)}
                          isCustomerService={isCustomerService} />
        })}
      </div>
  }
}
  
TicketMetadata.propTypes = {
  isCustomerService: PropTypes.bool.isRequired,
  ticket: PropTypes.instanceOf(AV.Object),
  categoriesTree: PropTypes.array.isRequired,
  updateTicketAssignee: PropTypes.func.isRequired,
  updateTicketCategory: PropTypes.func.isRequired,
  saveTag: PropTypes.func.isRequired,
}
  
TicketMetadata.contextTypes = {
  tagMetadatas: PropTypes.array,
}

export default TicketMetadata
  