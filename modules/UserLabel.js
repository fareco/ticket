import React from 'react'
import { Link } from 'react-router-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import PropTypes from 'prop-types'
import moment from 'moment'

import css from './UserLabel.css'
import { Avatar } from './Avatar'
import { getUserDisplayName } from '../lib/common'

const USER_TAG = {
  new: {
    content: 'New',
    tip: 'Registered within 3 months',
  },
  early: {
    content: 'Early',
    tip: 'Registered before 2 years ago',
  },
  vip: {
    content: 'VIP',
  },
}

function getUserTags(user) {
  const tags = []
  const createdAt = user.createdAt || user.created_at
  if (createdAt) {
    const now = moment()
    if (now.diff(createdAt, 'month') <= 3) {
      tags.push('new')
    }
    if (now.diff(createdAt, 'year') >= 2) {
      tags.push('early')
    }
  }
  return user.tags ? tags.concat(user.tags) : tags
}

function UserTag({ name }) {
  if (!USER_TAG[name]) {
    return <span className={css.tag}>{name}</span>
  }
  const { content, tip } = USER_TAG[name]
  const element = <span className={`${css.tag} ${css[name]}`}>{content}</span>
  if (tip) {
    return (
      <OverlayTrigger placement="bottom" overlay={<Tooltip id={`user-tag-${name}`}>{tip}</Tooltip>}>
        {element}
      </OverlayTrigger>
    )
  }
  return element
}
UserTag.propTypes = {
  name: PropTypes.string.isRequired,
}

export function UserTags({ user, className }) {
  const tags = getUserTags(user)
  if (tags.length === 0) {
    return null
  }
  return (
    <span className={className}>
      {tags.map((tag) => (
        <UserTag key={tag} name={tag} />
      ))}
    </span>
  )
}
UserTags.propTypes = {
  user: PropTypes.object.isRequired,
  className: PropTypes.string,
}

export function UserLabel({ user, simple, displayTags, displayId }) {
  const name = getUserDisplayName(user)
  if (simple) {
    return <span>{name}</span>
  }
  return (
    <span>
      <Link to={'/users/' + user.username} className="avatar">
        <Avatar user={user} />
      </Link>
      <Link to={'/users/' + user.username} className="username">
        {name}
      </Link>
      {displayId && <span className="text-muted"> ({user.username})</span>}
      {displayTags && <UserTags user={user} />}
    </span>
  )
}
UserLabel.displayName = 'UserLabel'
UserLabel.propTypes = {
  user: PropTypes.object.isRequired,
  simple: PropTypes.bool,
  displayTags: PropTypes.bool,
  displayId: PropTypes.bool,
}
