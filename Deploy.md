# 部署说明

自 `9e8207eae45f596bebb2e7fbc46055171010a5d8` 后提交的改动，若涉及到复杂的部署操作都会在这里进行记录。

## 2021-06-04

### `a20b1d2ed9815453bbd6262f86635210ac54fcc7`

需要为 Reply 添加列 `internal` ，类型为 `Boolean` 。

## 2021-06-17

### `ebc783f3456288fc74674138712fc65f8de352f3`

导入 Group、Ticket 与 OpsLog。

## 2021-06-22

### `bdb3cd1d9fa12b2195982a5d6524be1f901f6ddc`

导入 /resource/schema/QuickReply.json 。

## 2021-07-02

### `a6c9fe3182cd41dbcd26e796ec8d6ebecc3745bf`

1. 导出 `Config` 数据
2. 删除 `value` 列
3. 重新创建 `value` 列，类型为 `Any`
4. 手动恢复数据。如果原来启用了企业微信通知，直接删掉 `wechatToken`
5. 如果原来启用了百度翻译，新建一列 key = `translate.baidu`，value 为 `{ "appId", "appKey" }`，如果部署新版后没有问题，删除原来的 `translate.baidu.*` 行。
6. 部署新版本

## 2021-07-20

### `a86cd6d4231663d345a6f37d57d5fdacb0634562`

创建一个名为 `CACHE` 的 Redis 实例。

## 2021-08-12

### `f5b7f6423fff38acb72922317bc68f4fef9558b9`

重新导入 Group.json 。

## 2021-08-26

### `a07cb8bfe12e8dd8de7b71f522ee6226c6e1787a`

导入 notification.json 。

## 2021-08-31

### `c58be489dde13376c6000e87125d4a7ef0d62c0a`

重新导入 Reply.json 。

## 2021-09-02

### `8801cbbed85ae2a4fd15f22ff898af12a602d0fc`

导入 TicketFilter.json 。

### `facde73046f279297e511e12bc540d80b71d386f`

删除 Reply class 的 active 列，然后重新导入 Reply.json 。

## 2021-09-15

### `0a3eaddba44500c70bcc19afc655106a217c82ae`

修改了 Redis 中 Category 的格式，部署后需要清除 Category 的缓存：
```sh
> lean cache
> del categories
```

## 2021-10-12

### `60a95c84d057f2d68f1f437f0ca7020fe517eba9`

创建一个名为 `QUEUE` 的 Redis 实例，数据删除策略选择 `noeviction`。

## 2021-10-13

OpsLog 没有索引，在自用的 LeanTicket 上 40000+ 的数据量已经出现查询超时了，慢查询条件为 `where('ticket', '==', ptr).orderBy('createdAt')`。给 ticket 列加个索引，避免扫全表即可。

## 2021-10-21

### `f400cdc73c0328bb74bf934a17c370c127b4000e`

重新导入 notification.json 。并确保 notification 表有这个索引： user.$id_1_latestActionAt_-1


## 2021-10-29

### `462d917537206595c0a4812a98f740738950b806`

由于重写了触发器的实现，原有触发器将无法使用。

部署后，请在预备环境配置与原有触发器逻辑相同的新触发器，然后删除原有触发器。

## 2021-11-03

### `e0170388f9ad807a790368ed4be13e9529b4f5cc`

导入 TimeTrigger.json，重新配置逻辑相同的定时触发器，删除 Automation class。
