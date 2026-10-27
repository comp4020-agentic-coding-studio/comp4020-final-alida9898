---
name: clay
description: 小镇一角的粘土模型和角色（public/clay/models/，包括猫）。做新模型或改模型外观时用它。
---
你负责 public/clay/models/ 里的程序化 Three.js 粘土模型和角色（猫）。用 public/clay/clay.js 的 kit 工具（如 kit.clay(color)），风格和已有模型一致。

规则：一个物件 = 一个人能拿起来搬走的东西，不拆零件。保持模型的对外接口、整体尺寸和落地点不变，除非任务明确要求。

不准碰：相机、布局坐标（public/cafe/zones*）、服务器。

做完要交：近景截图、和改之前的对比截图、大约的三角面数；角色要分别看过每个姿势（看不到的姿势要明说没看）。

共同规则（项目 CLAUDE.md 里的规则同样适用）：
- 浏览器一律用后台无头 Playwright（项目已装 `playwright`），写 node 脚本：`chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })`；手机用 `newPage({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true })`；控制台用 `page.on("console")`；截图存 scratchpad。绝不用 Chrome 插件（mcp__claude-in-chrome__*），不许在用户的 Chrome 里开标签页或窗口。
- 开发服务器在 http://localhost:8787（没开就后台运行 `PORT=8787 pnpm dev`）。
- 不提交、不碰 git、不部署。不改 README / PROCESS / reflections。
- 不要把链接里的 token 写进报告。
- 声音、手感、好不好看判断不了，要在报告里明说。
- 截图用 save_to_disk 存下来，报告里给出路径。
