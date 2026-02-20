# IT TOOLBOX 全栈开发工具箱

## 文档1：IT-Toolbox-开发路线图-v3.docx

### 全栈开发工具箱
详细开发路线图·v3.0
基于Cloudflare Pages Functions能力边界的全功能规划
覆盖格式化·编码·加密·网络·文本·图片·颜色·生成·转换·时间·AI·DevOps
2026年2月

#### 0. Cloudflare Pages Functions能力边界
所有工具规划严格在Pages Functions支持的能力范围内。下表是完整的平台能力清单，工具的「实现方式」标注以此为依据。

| 能力/Binding | 支持状态 | 说明及工具箱用途 |
| :--- | :--- | :--- |
| 浏览器端Web Crypto API | √支持 | SHA-256/512、AES-GCM、RSA-OAEP、ECDSA、HMAC 等,所有加密工具的核心 |
| Workers KV | √支持 | 缓存外部API结果(汇率/DNS/IP),TTL自动过期,日写入 <200次 |
| Cloudflare R2 | √支持 | 临时文件中转(图片处理、大文件哈希),无出口流量费 |
| Workers AI | √支持 | 代码解释、正则/SQL/Shell生成,每项目一个AI binding |
| Cloudflare D1(SQLite) | √支持 | Phase4引入用户账号和历史记录持久化 |
| fetch()外部HTTP请求 | √支持 | 汇率API、WHOIS、cURL转发,每请求最多6个并发连接 |
| Node.js Compat (nodejs_compat) | √支持 | Buffer、crypto、stream等NodeAPI,解析useragent/MIME |
| WebSocket(服务端) | √支持 | AI流式输出、实时协作工具(如JSONdiff实时预览) |
| Cloudflare Images | √支持 | 图片压缩/格式转换(WebP/AVIF),需绑定R2作为源 |
| Service Bindings | √支持 | 可调用同账号下其他Workers(如独立的汇率Worker) |
| Analytics Engine | √支持 | 工具使用量统计,写入极快,不消耗D1资源 |
| Cron Triggers | X不支持 | Pages Functions不支持定时任务,汇率缓存改用请求触发懒 刷新 |
| Durable Objects(定义) | X不支持 | Pages Functions无法定义DO类,只能调用外部DO Worker |
| Cloudflare Queues | X不支持 | Pages Functions不支持作为Queue Consumer |
| TCP Socket(直连数据库) | x不支持 | 无法直连MySQL/PostgreSQL,需通过D1或Hyperdrive |

工具箱约90%的工具为纯前端计算(浏览器端Web Crypto+JS),无需Pages Functions参与。Pages Functions仅处理需要服务端环境的工具:IP查询、DNS查询、汇率、AI增强、WHOIS等。

#### 1.总体概览
##### 1.1规划数字

| 维度 | 数量 | 说明 |
| :--- | :--- | :--- |
| 工具总数 | 152个 | 覆盖12大类别,从格式化到AI增强 |
| 纯前端工具 | 118个 | 浏览器端计算,无API调用,零延迟,100%隐私 |
| 需API工具 | 34个 | Pages Functions+外部服务,KV缓存加速 |
| 开发总周期 | 20周 | 4个阶段,每阶段可独立交付,MVP第3周上线 |
| 开发阶段 | 4个 | Phase 1框架/Phase 2核心60工具/Phase 3进阶/Phase 4 AI+账号 |

##### 1.2阶段总览

| 阶段 | 周期 | 工具 数 | 核心交付 |
| :--- | :--- | :--- | :--- |
| Phase 1 | 第1-3周 | 15 | 框架搭建+高频工具首批:JSON/Base64/UUID/Hash/时间戳/密码 /URL/JWT等 |
| Phase 2 | 第4-9周 | 52 | 核心工具矩阵:编码全家桶、加密套件、文本处理、颜色、网络工具、 格式化 |
| Phase 3 | 第 10-15 周 | 51 | 进阶工具:图片处理、开发规范、数据生成、单位换算、HTTP测试、 二维码 |
| Phase 4 | 第周 16-20 | 34 | AI增强全套+用户账号(D1)+协作功能+性能优化 |

#### Phase1·框架+高频工具首批
第1-3周·15个工具·MVP可上线
目标:完成全部基础设施，上线第一批最高频工具。第3周末达到可对外发布的MVP状态。

##### 1.1基础设施(第1周)
在开始写工具之前，先把整个框架跑通:
*   项目脚手架:pnpm workspace/Vite/TypeScript/Tailwind/TanStack Router
*   工具注册表(registry.ts)+Fuse.js模糊搜索
*   通用ToolLayout容器(标题/复制/收藏/重置)
*   Cmd+K全局搜索面板(cmdk)
*   Sidebar分类导航+ToolCard网格
*   Zustand store(收藏、历史记录、主题)
*   wrangler.toml+Pages Functions Hono入口骨架
*   GitHub直连 Cloudflare Pages, CI验证 typecheck+ build

##### 1.2工具清单(第2-3周)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| json- formatter | JSON格式化 | 格式化/压缩/校验/错误定位,缩 进2/4可选,支持大文件 | 前端·纯计算 |
| base64 | Base64编解码 | 文本 Base64/ Base64URL编解 码,支持文件转Base64 | 前端·TextEncoder |
| url-encode | URL编解码 | encodeURIComponent/完整 URL 编解码,参数解析 | 前端·纯计算 |
| jwt-decoder | JWT解析 | 解析Header/Payload,时间戳转 人类时间,高亮过期 | 前端·atob |
| uuid- generator | UUID生成器 | UUID v4批量生成(最多1000), 大写/小写/带连字符可选 | 前端·crypto.randomUUID |
| hash- calculator | Hash计算器 | MD5(JS实现)/SHA- 1/256/384/512,支持文本和文件 | 前端·Web Crypto API |
| password-gen | 密码生成器 | 可配置字符集、长度、数量,强度 可视化,批量导出 | 前 端·crypto.getRandomValues |
| timestamp | 时间戳转换 | Unix→日期时间,支持毫秒/秒,全 球时区,自动识别当前时间 | 前端·dayjs |
| case- converter | 命名规范转换 | camelCase / PascalCase / snake case / kebab-case / CONSTANT | 前端·纯计算 |
| lorem-ipsum | 占位文本生成 | 英文Lorem/中文乱数假文,段落数 /单词数可配置 | 前端·纯计算 |
| color-picker | 颜色选择器 | HEX/RGB/HSL/HSV/CMYK互 转,色盘可视化 | 前端·chroma-js |
| markdown- preview | Markdown预览 | 实时渲染,支持GFM、数学公式、 代码高亮,导出HTML | 前端·marked+highlight.js |
| regex-tester | 正则表达式测试 | 实时高亮匹配,分组提取,多行模 式,常用正则库 | 前端·纯RegExp |
| number-base | 进制转换 | 二/八/十/十六进制互转,按位操 作可视化 | 前端·纯计算 |
| text-counter | 文本统计 | 字符数/单词数/行数/字节数/阅 读时间估算 | 前端·纯计算 |

Phase1结束时可上线MVP:15个工具覆盖最高频的日常开发场景,纯前端零延迟。

#### Phase2·核心工具矩阵
第4-9周·52个工具·总量达67个
目标:覆盖全部高频IT使用场景，每周交付8-10个工具。

##### 2.1编码&解码(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| html-entities | HTML实体编解码 | &<>"'及完整HTML5实体双向转换 | 前端·纯计算 |
| hex-encode | Hex编解码 | 文本→Hex,字节级别展示,支持分 隔符选项 | 前端·纯计算 |
| unicode- convert | Unicode转换 | 字符与Unicode码点互转,支持多种 表示格式 | 前端·纯计算 |
| morse-code | 摩斯密码 | 文本→摩斯电码,播放音频,支持速 度调节 | 前端·Web Audio API |
| binary-text | 二进制文本 | 文本+→二进制01字符串,多种编码 格式 | 前端·纯计算 |
| punycode | Punycode转换 | 国际化域名(IDN)Punycode编解码 | 前端·punycode.js |
| rot13 | ROT13/Caesar | ROT13及Caesar移位密码,偏移量 可调 | 前端·纯计算 |
| ascii-table | ASCII码表 | 完整ASCII/Unicode字符查询,支持 描述搜索 | 前端·静态数据 |

##### 2.2加密&安全(7个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| aes-encrypt | AES加密/解密 | AES-GCM对称加密,密钥由密码派 生(PBKDF2),Base64输出 | 前端·Web Crypto API |
| rsa-keygen | RSA密钥生成 | 2048/4096位 RSA密钥对,导出 PEM/DER/JWK | 前端·Web Crypto API |
| hmac | HMAC计算 | HMAC-SHA256/512,秘钥+消息→ 签名验证 | 前端·Web Crypto API |
| bcrypt | Bcrypt哈希 | bcrypt密码哈希与验证,rounds可配 置 | 前端·bcryptjs(wasm) |
| jwt-generator | JWT生成 | 填写Payload/Header,选择算法 HS256/RS256,预览生成Token | 前端·jose |
| cert-decoder | TLS证书解析 | 解析PEM证书,显示域名/有效期/指 纹/SAN | 前端·node-forge(wasm) |
| ssh-keygen | SSH密钥生成 | Ed25519/ RSA SSH密钥对生成, OpenSSH格式 | 前端·Web Crypto API |

##### 2.3格式化&美化(7个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| yaml-json | YAML→JSON | YAML与JSON双向互转,保留注释 选项,校验语法 | 前端·js-yaml |
| xml-formatter | XML格式化 | 格式化/压缩/校验XML,XPath查 询 | 前端·DOMParser |
| sql-formatter | SQL格式化 | MySQL/ PostgreSQL/SQLite方言, 关键字大写,对齐格式 | 前端·sql-formatter |
| css-formatter | CSS格式化 | CSS/SCSS/Less格式化与压缩,自 动添加厂商前缀 | 前端·prettier-wasm |
| js-formatter | JS/TS格式化 | JavaScript/ TypeScript/JSON5格式 化,prettier配置 | 前端·prettier-wasm |
| tom1-json | TOML→JSON | TOML与JSON双向互转,语法校验 | 前端· @iarna/toml |
| csv-viewer | CSV查看器 | CSV解析为表格,支持排序/过滤/统 计,导出JSON | 前端·papaparse |

##### 2.4文本处理(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| text-diff | 文本Diff | 行级/词级/字符级diff,并排/统一 视图,高亮增删 | 前端·diff.js |
| text- transform | 文本变换 | 去重/排序/反转/去空行/提取行/ 正则替换 | 前端·纯计算 |
| string-escape | 字符串转义 | JS/Python/Java/C字符串转义与 反转义 | 前端·纯计算 |
| json-to-type | JSON→类型定义 | JSON一键生成 TypeScript/Go/ Python/Kotlin类型 | 前端·quicktype-core |
| cron-parser | Cron表达式 | 解析/生成Cron,显示下5次执行时 间,人话描述 | 前端·cronstrue+cron- parser |
| placeholder- img | 占位图生成 | 生成指定尺寸/颜色/文字的占位图, SVG格式 | 前端·Canvas API |
| line-sorter | 行处理工具 | 排序/去重/随机打乱/提取第N行/ 行号添加 | 前端·纯计算 |
| text- statistics | 文本相似度 | Levenshtein/ Jaro-Winkler相似度计 算 | 前端·纯计算 |

##### 2.5颜色&设计(6个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| css-gradient | CSS渐变生成 | 线性/径向/锥形渐变可视化编辑,实 时预览,复制代码 | 前端·纯计算 |
| color-palette | 配色方案生成 | 输入主色→生成类比/互补/三角配 色,WCAG对比度 | 前端·chroma-js |
| contrast- checker | WCAG对比度 | 前景/背景色对比度检测,AA/AAA级 别判定 | 前端·纯计算 |
| color- blindness | 色盲模拟 | 模拟8种色觉缺陷(红绿蓝色盲等) 显示效果 | 前端·Canvas API |
| tailwind- colors | Tailwind色板 | 完整Tailwind v3/v4色板,点击复制 HEX/class名 | 前端·静态数据 |
| box-shadow- gen | Box Shadow生成 | 可视化调整box-shadow,预览,复制 CSS | 前端·纯计算 |

##### 2.6网络&HTTP(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| ip-lookup | IP地址查询 | 查询IP的城市/国家/ASN/时区,读取 CF请求头,KV缓存1h | Pages Functions+ CF Headers |
| dns-lookup | DNS查询 | A/AAAA/MX/TXT/CNAME/NS/SOA, 代理1.1.1.1 DoH,缓存5min | Pages Functions+fetch |
| url-parser | URL解析器 | 解析URL全部字段:协议/主机/路径/ 查询参数/片段 | 前端·URLAPI |
| http-status | HTTP状态码查询 | 全部1xx-5xx状态码说明,含RFC引 用,支持搜索 | 前端·静态数据 |
| http-headers | HTTP请求头查询 | 常见请求/响应头说明,安全头建议 | 前端·静态数据 |
| mime-types | MIME类型查询 | 文件扩展名←MIME类型,支持模糊 搜索 | 前端·mime-db |
| ip-subnet | IP子网计算 | CIDR计算网络地址/广播地址/主机 数,IPv4/IPv6 | 前端·纯计算 |
| curl- converter | cURL转换 | cURL命令→fetch/axios/Python requests/ Go http | 前端·curlconverter |

##### 2.7时间&日期(4个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| date-calc | 日期计算器 | 日期加减/两日期差值,工作日计算 | 前端·dayjs |
| timezone- convert | 时区转换 | 全球时区对照,多时区同屏显示,夏 令时自动处理 | 前端·dayjs-timezone |
| duration- format | 时长格式化 | 秒数hh:mm:ss/ISO 8601/人话描 述互转 | 前端·纯计算 |
| calendar-gen | 日历生成 | 生成指定年月日历,支持导出iCal | 前端·纯计算 |

##### 2.8生成器(4个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| nanoid-gen | NanoID生成器 | 自定义字符集和长度,批量生成,碰 撞概率计算 | 前端·nanoid |
| ulid-gen | ULID生成器 | 时间有序唯一ID,比UUID更友好, 支持批量 | 前端·ulid |
| objectid-gen | MongoDB ObjectID | 生成/解析 ObjectID,显示时间戳和机 器码 | 前端·纯计算 |
| faker-data | 假数据生成 | 姓名/邮箱/手机/地址/公司/信用卡,支 持中文,批量JSON导出 | 前端· @faker-js/faker |

#### Phase 3·进阶工具
第10-15周·51个工具·总量达118个
目标:覆盖更专业的IT使用场景，包括图片处理、开发规范、数据可视化等。

##### 3.1图片&媒体(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| image- compress | 图片压缩 | JPEG/PNG/WebP/AVIF压缩,质量可 调,批量处理,对比预览 | Pages Functions+ CF Images/R2 |
| image-convert | 图片格式转换 | PNG→JPEG→WebP→AVIF GIF,含透明通道处理 | Pages Functions+ CF Images |
| image-resize | 图片裁剪缩放 | 指定尺寸/比例,填充/裁剪/拉伸,批量 处理 | Pages Functions+ CF Images |
| svg-optimizer | SVG优化 | SVGO优化,去除冗余属性,压缩率 展示 | 前端·svgo(wasm) |
| svg-to-data- uri | SVG→Data URI | SVG文件转Data URI/Base64,可 内联到CSS/HTML | 前端·纯计算 |
| favicon-gen | Favicon生成 | 上传图片生成全套 favicon (16/32/48/180px),ZIP打包下载 | 前端·Canvas API |
| exif-reader | EXIF数据读取 | 读取图片EXIF信息:拍摄参数/GPS/ 设备型号,脱敏导出 | 前端·exifr |
| color- extractor | 图片取色 | 上传图片提取主色调,生成配色板, Hex/RGB复制 | 前端·Canvas API+ color-thief |

##### 3.2开发规范&文档(7个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| gitignore-gen | .gitignore生成 | 选择语言/框架/IDE,生成最佳实 践.gitignore | 前端·gitignore.io静态数 据 |
| license-gen | License生成 | MIT/Apache/GPL/BSD/ISC等,填入 作者/年份,下载LICENSE | 前端·静态模板 |
| readme-gen | README生成 | Markdown README模板生成器,徽 章选择,章节自由组合 | 前端·纯计算 |
| conventional- commit | 提交信息生成 | Conventional Commits格式,选择类 型/scope/描述 | 前端·纯计算 |
| semver-calc | SemVer计算器 | 语义版本范围计算,^/>=/<=解析, 版本对比 | 前端·semver |
| openapi- viewer | OpenAPI查看器 | 上传 swagger.json/yaml,可视化展示 API文档(SwaggerUI) | 前端·swagger-ui-reac |
| json-schema- gen | JSON Schema生成 | JSON数据→JSON Schema反推, 支持可选字段标注 | 前端·generate-schema |

##### 3.3数据生成&测试(6个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| json-gen | 随机JSON生成 | 定义Schema结构,批量生成随机 JSON,Mock接口数据 | 前端·纯计算 |
| sql-gen | SQL测试数据生成 | 定义表结构,生成INSERT语句,支 持外键关系 | 前端·纯计算 |
| regex-gen | 正则从样本生成 | 输入多个样本字符串,推断匹配正则 (基于规则) | 前端·纯计算 |
| hash-verify | 文件完整性校验 | 上传文件计算MD5/SHA256,与预期 值对比,支持批量 | 前端·Web Crypto API+ FileReader |
| jwt-verifier | JWT签名验证 | 输入HMAC秘钥或RSA公钥,验证 JWT签名 | 前端·jose |
| password- strength | 密码强度分析 | 实时分析密码强度,破解时间估算, 改进建议 | 前端·zxcvbn |

##### 3.4单位换算(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| exchange-rate | 汇率换算 | 实时汇率,150+货币,历史趋势, KV缓存1h | Pages Functions+ fetch +KV |
| number-unit | 数字单位换算 | 存储/速度/长度/重量/温度,全量 单位覆盖 | 前端·纯计算 |
| data-storage | 数据存储换算 | KB/MB/GB/TB/PB,SI与二进制单位 (KiB/MiB/GiB) | 前端·纯计算 |
| color-space | 色彩空间换算 | RGB/HSL/HSV/Lab/XYZ/Oklch 全量互转 | 前端·culori |
| epoch-formats | 多格式时间 | ISO 8601/RFC 2822/HTTP Date/ SQLTimestamp互转 | 前端·dayjs |
| aspect-ratio | 宽高比计算 | 像素尺寸→比例,常见分辨率参考, 裁剪建议 | 前端·纯计算 |
| css-unit- convert | CSS单位换算 | px/rem/em/vw/vh/pt/pc互转, 基准字号可配置 | 前端·纯计算 |
| roman-numeral | 罗马数字 | 阿拉伯数字→罗马数字,支持大数 | 前端·纯计算 |

##### 3.5二维码&条形码(3个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| qrcode-gen | 二维码生成 | 文本/URL/WiFi/vCard,颜色/LOGO 颜色/LOGO 自定义,SVG/PNG导出 | 前端·qrcode.js |
| qrcode-reader | 二维码识别 | 上传图片或摄像头扫码,支持多种格 式 | 前端 jsQR + getUserMedia |
| barcode-gen | 条形码生成 | EAN-13/EAN- 8/Code128/Code39/QR, SVG/PNG 导出 | 前端·JsBarcode |

##### 3.6网络进阶(6个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| whois-lookup | WHOIS查询 | 域名注册信息查询,代理外部WHOIS API | Pages Functions+fetch |
| ssl-checker | SSL证书检测 | 检测域名SSL有效期/颁发机构 /SANs,KV缓存 | Pages Functions+fetch |
| headers-check | HTTP安全头检测 | 检测目标URL的安全头覆盖情况 (CSP/HSTS/X-Frame等) | Pages Functions+fetch |
| port- reference | 常用端口参考 | 常见服务端口号查询,按协议/服务分 类 | 前端·静态数据 |
| user-agent- parse | UA解析器 | 解析User-Agent字符串,识别浏览器 /OS/设备 | 前端·ua-parser-js |
| email- validate | 邮箱格式验证 | RFC 5322合规验证,MX记录检查 (可选) | 前端+可选 Pages Functions |

##### 3.7数字&数学(5个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| math-eval | 数学表达式计算 | 计算复杂表达式,支持变量、函数、 矩阵,mathjs | 前端·mathjs |
| prime-checker | 质数检测 | 检测质数,分解质因数,生成质数序 列 | 前端·纯计算 |
| gcd-1cm | GCD/LCM计算 | 最大公约数/最小公倍数,多数支持 | 前端·纯计算 |
| float- visualizer | 浮点数可视化 | IEEE754单精度/双精度位级展示,精 度问题演示 | 前端·纯计算 |
| base-convert- ext | 扩展进制转换 | 2-36进制任意互转,支持小数部分 | 前端·纯计算 |

##### 3.8 JSON&数据工具(5个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| json-path | JSONPath查询 | 输入JSONPath表达式,实时高亮查 询结果 | 前端·jsonpath-plus |
| json-to-csv | JSON→CSV | JSON数组与CSV双向转换,列映射 可配置 | 前端·papaparse |
| json-to-table | JSON表格视图 | JSON数组渲染为可排序可过滤的表 格 | 前端·纯计算 |
| json-merge | JSON深度合并 | 两个JSON对象deep merge,冲突策 略可选 | 前端·纯计算 |
| json-schema-verify | JSON Schema验证 | 输入JSON+Schema,实时验证,错 误定位 | 前端·ajv |

##### 3.9 HTML&CSS工具(3个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| html-preview | HTML实时预览 | 左侧编辑HTML/CSS/JS,右侧实时渲 染,沙箱安全 | 前端·iframe sandbox |
| css-clip-path | CSS clip-path生成 | 可视化编辑多边形/圆形/椭圆,实时预 览clip-path | 前端·纯计算 |
| flexbox-gen | Flexbox生成器 | 可视化配置flexbox属性,实时预览, 复制CSS | 前端·纯计算 |

#### Phase 4·AI增强+账号系统+性能优化
第16-20周·34个工具·总量达152个
目标:引入WorkersAI增强全套工具，D1账号系统，PWA离线支持，全面性能优化。

##### 4.1AI增强工具(12个)
所有AI工具使用Workers AI binding(llama-3.1-8b-instruct/@cf/mistral-7b),通过 Pages Functions调用，输入长度限制4000字符，流式输出改善体验。

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| ai-code- explain | AI代码解释 | 粘贴代码,AI解释逻辑、关键概念、 潜在问题 | Pages Functions + Workers AI |
| ai-code- review | AI代码Review | AI进行Code Review,安全漏洞、性 能、可读性三维分析 | Pages Functions + Workers AI |
| ai-regex-gen | AI生成正则 | 自然语言描述→正则表达式,含解释 和测试用例 | Pages Functions + Workers AI |
| ai-sql-gen | AI生成SQL | 自然语言+Schema→SQL,含优化 建议 | Pages Functions + Workers AI |
| ai-json- schema | AI生成 Schema | 粘贴JSON样本,AI生成带注释的 JSON Schema | Pages Functions + Workers AI |
| ai-commit- msg | AI生成提交信息 | 粘贴diff内容,AI生成Conventional Commit消息 | Pages Functions + Workers AI |
| ai-text- extract | AI结构化提取 | 非结构化文本→指定字段JSON,如 从简历提取信息 | Pages Functions + Workers AI |
| ai-translate | AI翻译 | 多语言翻译,技术文档翻译,术语保 留 | Pages Functions + Workers AI |
| ai-naming | AI命名助手 | 描述功能→推荐变量/函数/类名,支 持命名规范选择 | Pages Functions + Workers AI |
| ai-error- explain | AI报错解释 | 粘贴错误信息,AI解释原因和修复方 案 | Pages Functions + Workers AI |
| ai-mock-data | AI生成Mock数据 | 自然语言描述数据结构,AI生成逼真 JSON数据 | Pages Functions + Workers AI |
| ai-shell-cmd | AI Shell命令生成 | 自然语言→bash/PowerShell命令, 含说明和风险提示 | Pages Functions + Workers AI |

##### 4.2用户账号系统(D1)(6个功能模块)
此模块引入Cloudflare D1数据库,需在 wrangler.toml新增[[d1_databases]] binding。账号系统可选,工具箱核心功能始终免登录可用。

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| auth | 账号注册/登录 | JWT无状态认证,邮箱验证,Bcrypt 密码存储 | Pages Functions+D1 |
| cloud-history | 云端历史记录 | 登录后自动同步工具使用历史,跨设 备访问 | Pages Functions+D1 |
| cloud- favorites | 云端收藏夹 | 收藏夹云端持久化,收藏分组,分享 链接 | Pages Functions+D1 |
| cloud- snippets | 代码片段保存 | 在工具页面保存常用输入(如常用 JSON模板),云端同步 | Pages Functions+D1 |
| usage-stats | 个人使用统计 | 使用频次热力图,最常用工具Top10 | Pages Functions+ D1+ Analytics Engine |
| shareable- links | 可分享链接 | 工具+输入内容编码进URL,可直接 分享当前状态 | 前端·URL Base64编码 |

##### 4.3效率&协作(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| batch-process | 批量处理模式 | 多工具批量处理(如批量Base64编 码多个文件) | 前端·纯计算 |
| tool-compare | 工具对比模式 | 同一输入同时用多个工具处理,并排 查看结果 | 前端·纯计算 |
| keyboard- shortcuts | 快捷键系统 | 全局快捷键覆盖,工具内快捷键, Cheatsheet面板 | 前端·纯计算 |
| api- playground | HTTP API测试 | 类 Postman界面, 发送 GET/POST/PUT/DELETE,查看响应 | Pages Functions+ fetch (代理) |
| json-rpc-test | JSON-RPC测试 | 构造JSON-RPC请求,查看响应,历 史记录 | Pages Functions+ fetch (代理) |
| webhook-test | Webhook测试 | 生成临时端点,接收并展示Webhook 请求内容 | Pages Functions+ KV (存储请求) |
| env-diff | 环境变量 Diff | 两段.env文件对比,高亮差异,安全 脱敏显示 | 前端·纯计算 |
| changelog-gen | Changelog生成 | Git log粘贴 →格式化 CHANGELOG.md | 前端·纯计算 |

##### 4.4前端工具扩展(8个)

| 工具ID | 工具名称 | 功能说明 | 实现方式 |
| :--- | :--- | :--- | :--- |
| grid- generator | CSS Grid生成器 | 可视化grid-template,拖拽布局,复 制CSS | 前端·纯计算 |
| animation-gen | CSS动画生成 | 可视化配置@keyframes/transition, 实时预览 | 前端·纯计算 |
| font-pair | 字体搭配 | Google Fonts搜索+搭配预览,复制 import代码 | 前端·静态数据 |
| icon-search | 图标搜索 | Lucide/ Heroicons/ Tabler图标搜 索,SVG/React复制 | 前端·静态索引 |
| meta-tag-gen | Meta标签生成 | OG/Twitter Card/SEO标签生成,预 览分享卡片 | 前端·纯计算 |
| sitemap-gen | Sitemap生成 | URL列表→XML Sitemap,优先级/ 频率可配置 | 前端·纯计算 |
| robots-gen | robots.txt生成 | 可视化配置 robots.txt, UA/Allow/Disallow/Sitemap | 前端·纯计算 |
| htaccess-gen | .htaccess生成 | 重定向/缓存/安全头.htaccess规则生 成 | 前端·纯计算 |

#### 2.里程碑时间线

| 周 里程碑 | 交付内容 |
| :--- | :--- |
| W1 | 基础框架完成 | 脚手架/路由/组件库/Cmd+K/GitHub→Pages CI跑通 |
| W3 | MVP上线 | 15个工具可用,Cloudflare Pages生产域名可访问 |
| W5 | Phase 2中期 | 编码/加密/格式化20个工具就绪 |
| W7 | 网络工具上线 | IP/DNS/URL/HTTP查询,Pages Functions API完整 |
| W9 | Phase 2完成 | 67个工具,覆盖日常90%需求,提交ProductHunt |
| W11 | 图片工具上线 | 图片压缩/转换/裁剪,CF Images集成 |
| W13 | 开发规范工具 | gitignore/License/README/OpenAPI全套 |
| W15 | Phase 3完成 | 118个工具,产品功能基本完备 |
| W17 | AI工具上线 | 12个AI增强工具,流式输出体验 |
| W19 | 账号系统上线 | D1注册/登录,收藏/历史云端同步 |
| W20 | v1.0正式版 | 152个工具,性能优化完成,PWA支持 |

#### 3.实现方式说明
路线图中每个工具标注了实现方式，含义如下:

| 标注 | 占比 | 说明 |
| :--- | :--- | :--- |
| 前端·纯计算 | 约60% | 完全浏览器端运行,零服务端,用户数据不离开设备,最快响应 |
| 前端·Web Crypto API | 约15% | 使用浏览器内置SubtleCrypto,GPU加速,无第三方加密库风险 |
| 前端·Canvas API | 约5% | 图片处理、二维码、颜色提取,浏览器端实时渲染 |
| Pages Functions+ fetch | 约10% | 需要服务端代理外部API(汇率/WHOIS/DNS/SSL),KV缓存结 果 |
| Pages Functions + Workers AI | 约8% | LLM推理需GPU支持,通过AIbinding调用,流式返回 |
| Pages Functions+D1 | 约2% | 账号系统Phase4引入,用户数据持久化 |

#### 4.KV用量规划
KV仅用于缓存，不做计数或状态存储。以下是Phase3完成后的预估日写入量。

| 缓存类型 | TTL | 预估写入/天 | Key格式 |
| :--- | :--- | :--- | :--- |
| IP查询 | 3600s | 约50次 | cache:ip:{ip} |
| DNS查询 | 300s | 约200次 | cache:dns:{domain}:{type} |
| 汇率数据 | 3600s | 约24次 | cache:exchange:{from}:{to} |
| WHOIS查询 | 3600s | 约30次 | cache:whois:{domain} |
| SSL检测 | 3600s | 约20次 | cache:ssl:{domain} |
| HTTP安全头 | 1800s | 约30次 | cache:headers:{url_hash} |
| Webhook临时存储 | 300s | 按需 | webhook:{id}:{seq} |
| 合计 | 一 | <400次/天 | 免费计划1000次/天,充裕 |

#### 5.关键依赖清单

| 包名 | 版本 | 用途 |
| :--- | :--- | :--- |
| hono | ^4.x | Pages Functions路由框架 |
| @tanstack/react- router | ^1.x | 类型安全前端路由,按工具懒加载 |
| zustand | ^5.x | 全局状态(收藏/历史/主题),持久化 |
| fuse.js | ^7.x | 工具注册表模糊搜索 |
| cmdk | ^1.x | Cmd+K搜索面板 |
| dayjs | ^1.x | 日期时间处理,时区支持 |
| chroma-js | ^2.x | 颜色空间转换、配色生成 |
| culori | ^3.x | 高精度色彩空间(Lab/Oklch) |
| js-yaml | ^4.x | YAML解析与序列化 |
| sql-formatter | ^15.x | SQL格式化,多方言 |
| diff | ^7.x | 文本diff算法 |
| papaparse | ^5.x | CSV解析 |
| qrcode | ^1.x | 二维码生成 |
| jsQR | ^1.x | 二维码识别 |
| jose | ^5.x | JWT生成与验证(Web Crypto原生) |
| @faker-js/faker | ^9.x | 假数据生成 |
| nanoid | ^5.x | NanoID生成 |
| semver | ^7.x | 语义版本解析 |
| zxcvbn | ^4.x | 密码强度评估 |
| svgo | ^3.x | SVG优化(wasm版) |
| cron-parser | ^4.x | Cron表达式解析 |
| cronstrue | ^2.x | Cron表达式转人话描述 |
| ua-parser-js | ^1.x | User-Agent解析 |
| @uiw/react- codemirror | ^4.x | 代码编辑器(JSON/SQL/Regex工具用) |
| marked + highlight.js | latest | Markdown渲染+代码高亮 |

依赖策略:优先使用wasm版本的工具库(svgo/prettier)以减少bundle大小;优先使用Web Crypto原生API而非JS密码库;避免引入Node.js专用依赖(使用Buffer polyfill时确认在Workers环境兼容)。

#### 6.优先级原则
在具体执行中，以下原则决定工具优先级:
1. 使用频率优先:JSON格式化/Base64/哈希/时间戳是每天都用的工具,最先上线
2. 纯前端优先:无需API的工具开发快、维护成本低、可随时上线，优先于需要后端的工具
3. 阶段内完整性:每个阶段交付的工具类别要完整,如「编码全家桶」要在同一阶段完成
4. AI工具最后:WorkersAI有用量限制，确保基础工具体验优秀后再叠加AI能力
5. 不做重复轮子:如果工具已有极好的在线实现(如regex101.com),考虑链接外部而非重复实现