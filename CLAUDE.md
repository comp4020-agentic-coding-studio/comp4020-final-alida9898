# 小镇一角 · 协作规则 / A Corner of Town · Working rules

## 说话 / Language
- 跟我聊天一律用中文。
  Always reply to me in Chinese.
- App 有两套完整语言：英文界面全是英文，中文界面全是中文，不混着放。每加一句界面文字，都同时写好中英两版，跟着语言切换（包括复制出去的邀请文字）。
  The app has two complete languages: English mode is all English, Chinese mode is all Chinese, never mixed. Every new UI string ships in both and follows the toggle (including copied invite text).

## 工作流程 / Workflow
### 先判断是哪种情况 / First decide which case this is
**A. 我要离开一段时间 / I'll be away for a while**（比如"我一个小时不回来" / e.g. "back in an hour"）
1. 先写好计划：列出每一项和总数。
   Write the plan first: every item, with the total count.
2. 我同意后，开子 agent 一项一项做，每项做完自己检查。
   Once I approve, run subagents item by item and self-check each one.
3. 每通过一项就提交并推送 `clay-wip`，最后给我一份报告和截图。
   Commit and push `clay-wip` after each passed item; finish with a report and screenshots.

**B. 我在这里看着，或者只是改小地方、说想法 / I'm watching, tweaking, or just sharing an idea**
1. 我说的可能只是一个想法。先写出"你的理解"：要改什么、改哪里、会影响什么。
   What I say may be just an idea. Write back your understanding: what changes, where, and what it affects.
2. 我根据你的理解提出调整，来回几次都可以。
   I adjust it, as many rounds as needed.
3. 我说同意之后才开始改。
   Start changing things only after I agree.

不确定是哪种，就按 B。 / When unsure, use B.

### 范围 / Scope
- 我只让改 A，就只改 A。
  If I ask to change A, change only A.
- 改动可能影响别的地方时（比如相机、视角），先说清楚；改完把受影响的地方都截图检查。
  If a change can affect other places (e.g. cameras), say so first, and screenshot every affected place afterwards.

### 保存 / Saving
- 我可能会忘记保存。每做完一轮、检查通过，要主动提醒我："这一轮可以保存了吗？"
  I may forget to save. After each round passes its checks, ask me: "Can we save this round?"
- 我说保存或 commit 才提交。
  Commit only when I say save / commit.
- 提交信息不加 Co-Authored-By 那一行。
  No Co-Authored-By trailer in commit messages.
- 备份只推到 `clay-wip` 分支。推到 `main` 会自动部署到线上，必须先问我。
  Push backups only to `clay-wip`. Pushing to `main` auto-deploys to Fly — ask me first.
- 没有我同意，不部署。
  Never deploy without my go-ahead.

## 子 agent / Subagents
固定四个，定义在 `.claude/agents/`。需要更细的分工时再加。
Four fixed agents, defined in `.claude/agents/`. Add more when finer roles are needed.

| 名字 Name | 负责 Owns | 不准碰 Must not touch | 做完要交 Hands back |
|---|---|---|---|
| camera | 店里和小镇所有视角：取景、遮挡、平视或俯视 / every camera view in shops and town: framing, occlusion, eye-level vs top-down | 模型、界面文字 / models, UI text | 每个受影响的视角都截图，包括改动范围以外的 / screenshots of every affected view, including ones outside the change |
| clay | `public/clay/models/` 里的模型和角色 / models and characters | 相机、布局坐标、服务器 / cameras, layout coords, server | 近景截图、改之前的对比、三角面数 / close-ups, before/after, triangle count |
| ui | 页面上的按钮、卡片、文字、中英文 / buttons, cards, text, both languages | 3D 场景、服务器 / 3D scene, server | 电脑和手机宽度的截图 / desktop and phone-width screenshots |
| checker | 只检查不改：`pnpm check`、控制台、按清单截图、两个窗口测多人 / checks only: `pnpm check`, console, checklist screenshots, two-tab multiplayer test | 任何代码 / any code | 通过或不通过，加上问题清单和截图 / pass/fail, issue list, screenshots |

- 改东西的 agent 做完，交给 checker 检查。不通过就退回去，最多两次，然后再给我看。
  A builder's work goes to checker; on failure it goes back, at most twice, then to me.
- 动作要用预览页的"暂停 / 下一帧"逐帧检查，不能只看一张静止截图。
  Check motion frame by frame (pause / next frame), never from one still.
- 声音、手感、好不好看，checker 判断不了，要说出来让我自己看。
  Sound, feel and taste can't be judged by checker — say so and let me look.
- 所有 agent 都开自己的新标签页，不许用我已经打开的标签页，做完要关掉。
  Every agent opens its own new tab, never reuses mine, and closes it when done.
- 不要把链接里的 token 贴进聊天。
  Never paste link tokens into chat.

## 编辑模式 / Editor mode
- 任何页面网址加 `?editor` 进入编辑模式：可以调物品的大小、位置，和当前区域的视角。
  Add `?editor` to any page URL to adjust item size, position and the current view.
- 只在本地开发时能用，线上不显示。
  Local development only; never on the deployed site.
- 按 Export 直接存进项目文件夹里的文件（`assets/editor/`）。我说"存好了"，就去读那个文件，照着改进正式代码，改完截图给我对照。
  Export writes straight into `assets/editor/`. When I say it's saved, read that file, apply it to the real code, and show me screenshots to compare.
- 编辑模式不改正式数据，也不能新增或删除物品。
  The editor never changes live data and can't add or remove items.
- 位置、大小、视角这类空间调整，优先让我用编辑模式，不要靠文字来回描述。
  For position / size / view tweaks, point me to the editor rather than describing in words.
- 我给截图说"这个大小刚好"，就以截图为准。
  When I send a screenshot saying "this size is right", the screenshot is the target.

## 谁来写什么 / Who writes what
- README、PROCESS、reflections 是我的，不要主动写。
  README, PROCESS and reflections are mine; don't write them unasked.
- reflections 必须是我自己的话。
  Reflections must be in my own words.

## 设计原则 / Design principles
- 安静、不评判、故意无聊：每件东西只有一个固定位置，不让玩家做决定。
  Calm, judgment-free, boring on purpose: every object has one fixed place; the player makes no decisions.
- 不做强制教程、不锁操作、不弹窗打断。提示要能跳过，在第一次遇到的时候才说一句。唯一例外：朋友每次进别人的小镇时选一次身份（名字或匿名）；主人第一次进自己的小镇要起名字，之后不再问。
  No forced tutorial, no locked input, no interrupting pop-ups. Hints are skippable and appear once, when first needed. One exception: a friend picks an identity (name or anonymous) each time they enter someone else's town; an owner names their town once on first visit and is never asked again.
- 一个物件 = 一个人能拿起来搬走的东西，不拆零件（咖啡机是一整件，杯子另算）。
  One item = one thing a person can pick up and carry; never split into parts.
- 小东西要放大到它所在的那件家具才能放。
  Small items are placed only when zoomed into the piece they sit on.
- 墙上和柜台上的东西用平视视角，不要俯视。没把握用哪种视角时先问我。
  Wall and counter items use eye-level views, not top-down. When unsure which view, ask me.
- 目前只有猫一个角色（狸花猫，上釉粘土感），要做得精细。以后可能会加别的角色。
  For now the cat (a glazed-clay grey tabby) is the only character and must be refined. More may come later.
- 不做登录和账号（作业不要求，访客链接已经够用）。
  No login or accounts (not required; the guest link is enough).

## 不要自作主张 / Don't act on your own
- 看到不认识的改动，不要自己还原，先问我。
  Never revert an unfamiliar change; ask first.
- 多人协作的点子要有参考先例，不要硬编。
  Multiplayer ideas need real precedents, not invention.
