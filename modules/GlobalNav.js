import React, { useContext } from 'react'
import { Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import i18next from 'i18next'
import PropTypes from 'prop-types'
import * as Icon from 'react-bootstrap-icons'
import { getUserDisplayName } from '../lib/common'
import { getConfig } from './config'
import { AppContext } from './context'
import { http } from '../lib/leancloud'
import { useQuery } from 'react-query'
import EmptyBadge from './components/EmptyBadge'

export default function GlobalNav({ user, onLogout }) {
  const { t } = useTranslation()
  const { isCustomerService } = useContext(AppContext)

  const handleChangeLanguage = (lang) => {
    i18next.changeLanguage(lang)
  }

  const { data: unread } = useQuery({
    queryKey: 'unread',
    queryFn: () => http.get('/api/2/unread'),
    staleTime: 300_000,
  })

  return (
    <Navbar bg="light" expand="md" fixed="top">
      <Container>
        <Navbar.Brand className="font-logo" as={Link} to="/">
          {getConfig('nav.home.title', 'LeanTicket')}
        </Navbar.Brand>

        <Navbar.Toggle />

        <Navbar.Collapse>
          <Nav className="mr-auto">
            {isCustomerService ? (
              <>
                <Nav.Link
                  as={Link}
                  to={getConfig(
                    'nav.customerServiceTickets.href',
                    '/customerService/tickets?assignee=me&stage=todo'
                  )}
                >
                  {t('customerServiceTickets')}
                </Nav.Link>
                <Nav.Link as={Link} to={getConfig('nav.stats.href', '/customerService/stats')}>
                  {t('statistics')}
                </Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to={getConfig('nav.tickets.href', '/tickets')}>
                {t('ticketList')}
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            {user && (
              <Button className="mx-3" variant="success" as={Link} to="/tickets/new">
                {t('newTicket')}
              </Button>
            )}
            <Nav.Link as={Link} to="/notifications">
              <Icon.BellFill />
              {unread > 0 && <EmptyBadge />}
            </Nav.Link>
            {/* eslint-disable i18n/no-chinese-character */}
            <NavDropdown className="mx-2" title="EN/中">
              <NavDropdown.Item onClick={() => handleChangeLanguage('en')}>
                English
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleChangeLanguage('zh')}>中文</NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleChangeLanguage('ko')}>한국어</NavDropdown.Item>
            </NavDropdown>
            {/* eslint-enable i18n/no-chinese-character */}
            {user ? (
              <NavDropdown title={getUserDisplayName(user)}>
                <NavDropdown.Item as={Link} to="/settings">
                  {t('settings')}
                </NavDropdown.Item>
                <NavDropdown.Item onClick={onLogout}>{t('logout')}</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
                {t('login')}
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
GlobalNav.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
}
