# 新增功能 Demo 指南

## 真实 Featured Event 与图片演示

- Featured Event 保留原卡片设计，自动选择未取消且尚未开始的真实活动中报名人数最多的一场；人数相同时按开始时间、活动 ID 排序。没有符合条件的活动时显示空状态。
- 活动图片、标题、说明、类型、地点、日期和报名人数均来自数据库。View Event 进入对应详情，创建者可从详情进入编辑。
- Create / Edit 表单的 Location 下方有 Event type / Category，支持 Workshop、Seminar、Social、Sports。保存后重新进入首页即可看到更新。
- 首页分类入口使用精确类别筛选，关键词搜索仍可匹配标题、地点和类型。
- 项目 photos 文件夹提供 6 张小于 2 MiB 的 JPEG 演示图片，图片来源和使用说明见 photos/README.md。
- 演示顺序：创建未来活动并选 Seminar、上传 03-seminar-speaker.jpg，让其报名人数最多 → 返回首页查看真实 Featured Event → View Event → Edit 改类型为 Workshop 并换 01-workshop-team.jpg → 返回首页检查图片及类型 → 点击 Workshop 分类查看结果。

## 展示目标

从原来的“登录 + 活动 CRUD”推进到完整的活动参与流程：
搜索活动 → 用户报名 → Organizer 管理参加者 → 取消活动 → 已报名用户收到站内通知。

建议用 6–8 分钟展示新增能力，不必重新演示整个 Part A。

## 演示前准备（不占现场时间）

1. 正常启动后端和前端。后端在项目根目录运行 npm start；另一个终端进入 client 运行 npm run dev。
2. 准备两个 Organizer（A、B）和两个 Attendee（例如 Alice、Bob）。这些是建议的演示账号，需要你预先创建；自动测试的临时账号不会保留。
3. 准备两个尚未取消的活动：
   - AI Workshop：Workshop，City Campus，capacity = 2，填写未来日期和时间。
   - Career Seminar：Seminar，Library，capacity = 5。
4. 演示前检查这两场活动的报名人数。第一次演示可从 0 开始。
5. 可使用普通窗口登录 Organizer、无痕窗口登录 Attendee；或在同一窗口 Logout 后切换。普通浏览器的两个标签页通常共享登录状态，不能当作两个独立账号。
6. 如果要同时展示两条未读通知，预先让 Alice 报名 Career Seminar。不要提前取消主活动。
7. 本次只是站内通知：不需要邮箱配置，也不会发送邮件或系统桌面推送。

## 现场顺序

| 顺序 | 角色 | 操作 | 预期结果与讲解重点 |
| --- | --- | --- | --- |
| 1，30秒 | Attendee | 登录并刷新页面 | 姓名、角色和登录状态仍在。说明身份由服务器 Session 确认，权限在后端检查。 |
| 2，45秒 | Attendee | Navbar 搜索 AI；再搜索 Library 或 Seminar；尝试无匹配词；点击 Clear Search | 标题、地点、类别都能查到，显示结果数量和无结果提示。刷新会保留搜索词。 |
| 3，60秒 | Alice | 搜索 AI，点击 Join Event，打开 My Bookings；取消报名，再重新报名 | 人数 0/2 → 1/2 → 0/2 → 1/2；报名列表和按钮状态同步。重复报名不会产生第二条记录。 |
| 4，90秒 | Organizer | Events → Manage Event，查看 Alice；搜索 Bob 并 Add；Remove Bob，再 Add | 人数 1/2 → 2/2 → 1/2 → 2/2，名单与用户信息可见。说明 Organizer 只能管理自己创建的活动。 |
| 5，45秒 | Organizer | 填 Cancellation reason：Presenter unavailable.，点击 Cancel Event | 活动显示 Cancelled，保留原因和报名名单，不能再接受新报名；系统给当时已报名的 Alice、Bob 各生成一条通知。 |
| 6，60秒 | Alice | 点击铃铛，查看活动名、原因、时间；点击 Mark as Read；刷新 | 红色未读数字减少，通知保留并标为 Read，刷新后状态仍然正确。点击 View Event 能看到已取消的活动。 |
| 7，30秒，可选 | Alice | 选择 Unread；有多条未读时点击 Mark All as Read | 一次清除当前账号的未读状态；All 中仍保留通知。 |

最后一句可说：
“The platform now supports the full workflow from event discovery and registration to participant administration and cancellation notifications.”

## 可选加分展示

- **活动归属**：Organizer A 创建带图片的活动，再切换到 Organizer B。B 能浏览活动，但没有编辑和参加者管理入口；直接访问编辑地址也会被拒绝。
- **图片上传**：创建活动时选取不超过 2 MiB 的 JPEG、PNG 或 WebP，展示预览和发布后的活动封面；编辑时可更换或删除。
- **日期校验**：尝试选择昨天，日期选择器不允许；今天已经过去的时间也不能提交。页面按 Newcastle 的 Australia/Sydney 时区判断，后端同样会拦截无效时间。
- **容量限制**：AI Workshop 满 2 人后，用第三个未报名的 Attendee 查看，显示 Event Full。或者尝试把容量改为 1，后端会拒绝低于已有报名人数的修改。
- **通知隔离**：用未报名的第三个用户查看通知中心，不会收到这场活动的取消通知。
- **全部已读**：让 Alice 同时报名两场活动，Organizer 依次取消，展示未读 2 → 单条已读后 1 → 全部已读后 0。
- **后端校验**：可在讲解中提及接口测试已覆盖未登录访问、Attendee 调用管理员接口以及伪造 userId。不必现场打开数据库或修改浏览器存储。
- **取消与删除的区别**：有参加者的活动使用 Cancel Event，让用户仍能查到原因。只有无报名记录的活动允许永久删除，主流程不需要演示删除。

## 现场细节

- 活动取消后不能重新激活。重复排练请新建一场演示活动，不要重复取消同一场。
- 通知在数据库中即时创建；当前可见页面每 15 秒检查一次。回到窗口、点击铃铛或通知中心的 Refresh 可立即检查，不需要现场空等。
- 点击 View Event 不会自动标记已读；使用 Mark as Read 或 Mark All as Read 明确修改状态。
- 单条通知会保留取消时的活动名称和原因。即使之后移除报名并删除活动，通知内容仍保留，但不会提供失效的 View Event 链接。
- 只有本次更新后发生的取消操作会生成通知；不会给历史已取消活动补发。
- 注册时仍可选择 Organizer，这是当前课程 demo 的角色发放方式。不要把它描述成管理员审批系统。
- 首页分类点击、Update Profile 和 Subscribe 等其他占位入口不在本轮范围内，演示时无需点击。

## 相较开始时新增的内容

- 服务端 Session、HttpOnly Cookie、后端身份和角色校验。
- Attendee 报名、取消报名、My Bookings、实时更新的报名人数、防重复与防超额。
- Organizer 查看参加者、搜索用户、代报名、移除参加者，以及仅限活动创建者的管理权限。
- 活动取消状态、原因和保留的报名记录。
- Navbar 活动搜索、结果数量、无结果提示、Clear Search、可刷新和分享的搜索网址。
- 自动生成的取消通知、个人通知中心、铃铛未读数字、All / Unread、单条及全部已读、自动刷新。

## 验证

19 组后端集成测试覆盖会话、权限、报名、并发容量、搜索、通知收件人、账号隔离、已读、持久化、重复取消防重和失败回滚。
前端 ESLint 和生产构建通过。浏览器已验证搜索、空结果、取消发通知、未读更新、单条/全部已读、刷新持久化以及账号切换隔离。

## 本轮老师反馈更新

活动管理已从全站 Organizer 管理改为创建者专属权限；新增安全图片上传、更换和删除，以及前后端未来日期校验。旧活动继续保留，已经开始的活动停止新增报名。建议先用两个 Organizer 演示归属限制，再创建带图片的未来活动，接着走上面的搜索、报名和通知流程。

本轮浏览器验证：图片选择后预览、带图创建及实际图片加载、过去日期限制、切换 Organizer 后隐藏管理入口、直接访问他人编辑地址时拒绝；测试使用独立内存数据库，不改动项目现有数据。
