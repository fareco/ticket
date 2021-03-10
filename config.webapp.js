/* eslint-disable react/display-name */
import React from 'react'
import { setConfig } from './modules/config'

// Used in CustomerServiceStats.
// 0/-1/-2/...: a week ends at 23:59:59 Sunday/Saturday/Friday/...
setConfig('stats.offsetDays', -3)

setConfig('weekendWarning.enabled', true)

/* eslint-disable i18n/no-chinese-character */
setConfig('ticket.metadata.customMetadata.comments', {
  openId: '心动账号 ID',
  userId: '角色 ID',
  userName: '角色名',
  deviceModel: '设备型号',
  operatingSystem: '操作系统',
})
/* eslint-enable i18n/no-chinese-character */

setConfig('ticket.metadata.customMetadata.valueRenderers', {
  openId: (id) => <a href={`https://pt.xindong.com/kefu_issue/user_info/${id}`}>{id}</a>,
  userId: (id) => <a href={`https://www.xdapp.com/smash/player/?sid=0&pid=${id}`}>{id}</a>,
  ip: (ip) => <a href={`https://nali.leanapp.cn/ip/${ip}`}>{ip}</a>,
  localDNS: (ip) => <a href={`https://nali.leanapp.cn/ip/${ip}`}>{ip}</a>,
})
