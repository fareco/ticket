import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import moment from 'moment'
import { useAppContext } from 'modules/context'
import { http } from '../../lib/leancloud'
import styles from './index.css'
import { UserLabel } from '../UserLabel'
import { useTranslation } from 'react-i18next'
import { TicketStatusLabel } from '../components/TicketStatusLabel'

function RecentTickets({ authorId, excludeNid }) {
  const { t } = useTranslation()
  const { addNotification } = useAppContext()
  const { data } = useQuery({
    queryKey: ['tickets', authorId, excludeNid],
    queryFn: () =>
      http.get('/api/1/tickets', {
        params: {
          author_id: authorId,
          page_size: excludeNid ? 11 : 10,
          q: 'sort:created_at-desc',
        },
      }),
    enabled: !!authorId,
    onError: addNotification,
  })
  const tickets = useMemo(() => {
    if (!data) {
      return []
    }
    if (!excludeNid) {
      return data
    }
    return data.filter((ticketItem) => ticketItem.nid !== excludeNid)
  }, [data, excludeNid])

  if (tickets.length === 0) {
    return null
  }
  return (
    <>
      <div className={styles.recentTitle}>
        {t('ticket.recently')}
        <span className={styles.allTickets}>
          {' '}
          (<Link to={`/customerService/tickets?authorId=${authorId}`}>{t('allTickets')}</Link>)
        </span>
      </div>
      <ul className={styles.recentList}>
        {tickets.map((ticketItem) => (
          <li key={ticketItem.nid}>
            <Link
              to={`/tickets/${ticketItem.nid}`}
              title={ticketItem.title}
              className={styles.link}
            >
              <span className={styles.nid}>#{ticketItem.nid}</span>
              {ticketItem.title}
            </Link>

            <span>
              <TicketStatusLabel status={ticketItem.status} />
            </span>

            <span
              className={styles.timestamp}
              title={moment(ticketItem.created_at).format('YYYY-MM-DD HH:MM')}
            >
              {t('createdAt')} {moment(ticketItem.created_at).fromNow()}
            </span>

            <span>
              {ticketItem.assignee ? (
                <UserLabel user={ticketItem.assignee} />
              ) : (
                `<${t('unassigned')}>`
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

RecentTickets.propTypes = {
  authorId: PropTypes.string.isRequired,
  excludeNid: PropTypes.number,
}
const MemoRecentTickets = React.memo(RecentTickets)
export { MemoRecentTickets as RecentTickets }
