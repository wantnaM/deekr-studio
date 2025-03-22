import ThreeMinTopAppLogo from '@renderer/assets/images/apps/3mintop.png?url'
// import AbacusLogo from '@renderer/assets/images/apps/abacus.webp?url'
// import AIStudioLogo from '@renderer/assets/images/apps/aistudio.svg?url'
import BaiduAiAppLogo from '@renderer/assets/images/apps/baidu-ai.png?url'
import BaiduAiSearchLogo from '@renderer/assets/images/apps/baidu-ai-search.webp?url'
import BaicuanAppLogo from '@renderer/assets/images/apps/baixiaoying.webp?url'
import BoltAppLogo from '@renderer/assets/images/apps/bolt.svg?url'
// import CiciAppLogo from '@renderer/assets/images/apps/cici.webp?url'
import CozeAppLogo from '@renderer/assets/images/apps/coze.webp?url'
// import DevvAppLogo from '@renderer/assets/images/apps/devv.png?url'
// import DifyAppLogo from '@renderer/assets/images/apps/dify.svg?url'
import DoubaoAppLogo from '@renderer/assets/images/apps/doubao.png?url'
// import DuckDuckGoAppLogo from '@renderer/assets/images/apps/duckduckgo.webp?url'
import FeloAppLogo from '@renderer/assets/images/apps/felo.png?url'
// import FlowithAppLogo from '@renderer/assets/images/apps/flowith.svg?url'
import GeminiAppLogo from '@renderer/assets/images/apps/gemini.png?url'
// import GensparkLogo from '@renderer/assets/images/apps/genspark.jpg?url'
// import GithubCopilotLogo from '@renderer/assets/images/apps/github-copilot.webp?url'
// import GrokAppLogo from '@renderer/assets/images/apps/grok.png?url'
import HikaLogo from '@renderer/assets/images/apps/hika.webp?url'
// import HuggingChatLogo from '@renderer/assets/images/apps/huggingchat.svg?url'
import ISlideLogo from '@renderer/assets/images/apps/iSlide.jpg?url'
import KimiAppLogo from '@renderer/assets/images/apps/kimi.webp?url'
// import LambdaChatLogo from '@renderer/assets/images/apps/lambdachat.webp?url'
// import LeChatLogo from '@renderer/assets/images/apps/lechat.png?url'
import MetasoAppLogo from '@renderer/assets/images/apps/metaso.webp?url'
// import MonicaLogo from '@renderer/assets/images/apps/monica.webp?url'
import NamiAiLogo from '@renderer/assets/images/apps/nm.png?url'
import NamiAiSearchLogo from '@renderer/assets/images/apps/nm-search.webp?url'
// import NotebookLMAppLogo from '@renderer/assets/images/apps/notebooklm.svg?url'
// import PerplexityAppLogo from '@renderer/assets/images/apps/perplexity.webp?url'
// import PoeAppLogo from '@renderer/assets/images/apps/poe.webp?url'
import ZhipuProviderLogo from '@renderer/assets/images/apps/qingyan.png?url'
// import QwenlmAppLogo from '@renderer/assets/images/apps/qwenlm.webp?url'
// import SensetimeAppLogo from '@renderer/assets/images/apps/sensetime.png?url'
import SparkDeskAppLogo from '@renderer/assets/images/apps/sparkdesk.webp?url'
// import ThinkAnyLogo from '@renderer/assets/images/apps/thinkany.webp?url'
import TiangongAiLogo from '@renderer/assets/images/apps/tiangong.png?url'
// import WanZhiAppLogo from '@renderer/assets/images/apps/wanzhi.jpg?url'
import WPSLingXiLogo from '@renderer/assets/images/apps/wpslingxi.webp?url'
import XiaoYiAppLogo from '@renderer/assets/images/apps/xiaoyi.webp?url'
// import YouLogo from '@renderer/assets/images/apps/you.jpg?url'
import TencentYuanbaoAppLogo from '@renderer/assets/images/apps/yuanbao.webp?url'
import YuewenAppLogo from '@renderer/assets/images/apps/yuewen.png?url'
import ZhihuAppLogo from '@renderer/assets/images/apps/zhihu.png?url'
// import ClaudeAppLogo from '@renderer/assets/images/models/claude.png?url'
import HailuoModelLogo from '@renderer/assets/images/models/hailuo.png?url'
import QwenModelLogo from '@renderer/assets/images/models/qwen.png?url'
import DeepSeekProviderLogo from '@renderer/assets/images/providers/deepseek.png?url'
// import GroqProviderLogo from '@renderer/assets/images/providers/groq.png?url'
import OpenAiProviderLogo from '@renderer/assets/images/providers/openai.png?url'
// import SiliconFlowProviderLogo from '@renderer/assets/images/providers/silicon.png?url'
import MinApp from '@renderer/components/MinApp'
import { MinAppType } from '@renderer/types'

export const DEFAULT_MIN_APPS: MinAppType[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    logo: OpenAiProviderLogo,
    bodered: true,
    group: 'AI大模型',
    desc: 'OpenAI开发的通用对话型AI'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    logo: GeminiAppLogo,
    group: 'AI大模型',
    desc: '谷歌开发的生成式AI对话模型'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    logo: DeepSeekProviderLogo,
    group: 'AI大模型',
    desc: '深度求索公司研发的智能对话系统'
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    url: 'https://chatglm.cn/main/alltoolsdetail',
    logo: ZhipuProviderLogo,
    group: 'AI大模型',
    desc: '智谱AI开发的多模态对话模型'
  },
  {
    id: 'moonshot',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn/',
    logo: KimiAppLogo,
    group: 'AI大模型',
    desc: '月之暗面研发的长文本处理AI'
  },
  {
    id: 'baichuan',
    name: '百小应',
    url: 'https://ying.baichuan-ai.com/chat',
    logo: BaicuanAppLogo,
    group: 'AI大模型',
    desc: '百川智能推出的对话助手'
  },
  {
    id: 'dashscope',
    name: '通义千问',
    url: 'https://tongyi.aliyun.com/qianwen/',
    logo: QwenModelLogo,
    group: 'AI大模型',
    desc: '阿里云开发的通用大语言模型'
  },
  {
    id: 'stepfun',
    name: '跃问',
    url: 'https://yuewen.cn/chats/new',
    logo: YuewenAppLogo,
    bodered: true,
    group: 'AI大模型',
    desc: '阶跃星辰研发的智能问答平台'
  },
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com/chat/',
    logo: DoubaoAppLogo,
    group: 'AI大模型',
    desc: '字节跳动推出的AI对话助手'
  },
  {
    id: 'minimax',
    name: '海螺',
    url: 'https://hailuoai.com/',
    logo: HailuoModelLogo,
    group: 'AI大模型',
    desc: 'MiniMax开发的智能对话产品'
  },
  {
    id: 'baidu-ai-chat',
    name: '文心一言',
    logo: BaiduAiAppLogo,
    url: 'https://yiyan.baidu.com/',
    group: 'AI大模型',
    desc: '百度研发的生成式对话模型'
  },
  {
    id: 'baidu-ai-search',
    name: '百度AI搜索',
    logo: BaiduAiSearchLogo,
    url: 'https://chat.baidu.com/',
    bodered: true,
    style: { padding: 5 },
    group: 'AI搜索',
    desc: '百度推出的AI增强搜索引擎'
  },
  {
    id: 'tencent-yuanbao',
    name: '腾讯元宝',
    logo: TencentYuanbaoAppLogo,
    url: 'https://yuanbao.tencent.com/chat',
    bodered: true,
    group: 'AI大模型',
    desc: '腾讯开发的智能效率助手'
  },
  {
    id: 'spark-desk',
    name: 'SparkDesk',
    logo: SparkDeskAppLogo,
    url: 'https://xinghuo.xfyun.cn/desk',
    group: 'AI大模型',
    desc: '讯飞星火认知大模型平台'
  },
  {
    id: 'metaso',
    name: '秘塔AI搜索',
    logo: MetasoAppLogo,
    url: 'https://metaso.cn/',
    group: 'AI搜索',
    desc: 'AI驱动的专业搜索引擎'
  },
  {
    id: 'tiangong-ai',
    name: '天工AI',
    logo: TiangongAiLogo,
    url: 'https://www.tiangong.cn/',
    bodered: true,
    group: 'AI搜索',
    desc: '昆仑万维研发的智能助手'
  },
  {
    id: 'Felo',
    name: 'Felo',
    logo: FeloAppLogo,
    url: 'https://felo.ai/',
    bodered: true,
    group: 'AI搜索',
    desc: '多语言实时翻译AI工具'
  },
  {
    id: 'nm',
    name: '纳米AI',
    logo: NamiAiLogo,
    url: 'https://bot.n.cn/',
    bodered: true,
    group: 'AI大模型',
    desc: '轻量化AI对话解决方案'
  },
  {
    id: 'nm-search',
    name: '纳米AI搜索',
    logo: NamiAiSearchLogo,
    url: 'https://www.n.cn/',
    bodered: true,
    group: 'AI搜索',
    desc: '精准答案型AI搜索引擎'
  },
  {
    id: 'hika',
    name: 'Hika',
    logo: HikaLogo,
    url: 'https://hika.fyi/',
    bodered: true,
    group: 'AI搜索',
    desc: '知识图谱增强搜索工具'
  },
  {
    id: '3mintop',
    name: '3MinTop',
    logo: ThreeMinTopAppLogo,
    url: 'https://3min.top',
    bodered: false,
    group: '效率工具',
    desc: '快速生成摘要的效率工具'
  },
  {
    id: 'xiaoyi',
    name: '小艺',
    logo: XiaoYiAppLogo,
    url: 'https://xiaoyi.huawei.com/chat/',
    bodered: true,
    group: 'AI大模型',
    desc: '华为智能终端AI助手'
  },
  {
    id: 'coze',
    name: 'Coze',
    logo: CozeAppLogo,
    url: 'https://www.coze.com/space',
    bodered: true,
    group: '开发平台',
    desc: '字节跳动AI Bot开发平台'
  },
  {
    id: 'wpslingxi',
    name: 'WPS灵犀',
    logo: WPSLingXiLogo,
    url: 'https://copilot.wps.cn/',
    bodered: true,
    group: '效率工具',
    desc: '金山办公AI生产力套件'
  },
  {
    id: 'zhihu',
    name: '知乎直答',
    logo: ZhihuAppLogo,
    url: 'https://zhida.zhihu.com/',
    bodered: true,
    group: '知识社区',
    desc: '知乎问答社区AI入口'
  },
  {
    id: 'islide',
    name: 'iSlide',
    logo: ISlideLogo,
    url: 'https://www.islide.cc/',
    bodered: true,
    group: '效率工具',
    desc: 'PPT智能设计效率工具'
  },
  {
    id: 'bolt',
    name: 'bolt',
    logo: BoltAppLogo,
    url: 'https://bolt.new/',
    bodered: true,
    group: '创新实验',
    desc: '创新型即时问答实验平台'
  }
]

export function startMinAppById(id: string) {
  const app = DEFAULT_MIN_APPS.find((app) => app?.id === id)
  app && MinApp.start(app)
}
