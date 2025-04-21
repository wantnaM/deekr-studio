import AiPPTLogo from '@renderer/assets/images/apps/aippt.png?url'
import BaiduAiAppLogo from '@renderer/assets/images/apps/baidu-ai.png?url'
import BaiduAiSearchLogo from '@renderer/assets/images/apps/baidu-ai-search.webp?url'
import BaicuanAppLogo from '@renderer/assets/images/apps/baixiaoying.webp?url'
import BoardmixLogo from '@renderer/assets/images/apps/boardmix.png?url'
import CanvaAppLogo from '@renderer/assets/images/apps/canva.jpg?url'
import CozeAppLogo from '@renderer/assets/images/apps/coze.webp?url'
import DoubaoAppLogo from '@renderer/assets/images/apps/doubao.png?url'
import GeminiAppLogo from '@renderer/assets/images/apps/gemini.png?url'
import HikaLogo from '@renderer/assets/images/apps/hika.webp?url'
import ISlideLogo from '@renderer/assets/images/apps/iSlide.jpg?url'
import KimiAppLogo from '@renderer/assets/images/apps/kimi.webp?url'
import LaiHuaLogo from '@renderer/assets/images/apps/laihua.png?url'
import MetasoAppLogo from '@renderer/assets/images/apps/metaso.webp?url'
import MindMasterLogo from '@renderer/assets/images/apps/mindmaster.png?url'
import NamiAiLogo from '@renderer/assets/images/apps/nm.png?url'
import NamiAiSearchLogo from '@renderer/assets/images/apps/nm-search.webp?url'
// import OpenAiProviderLogo from '@renderer/assets/images/providers/openai.png?url'
import PythonTutorLogo from '@renderer/assets/images/apps/python-tutor.png?url'
import ZhipuProviderLogo from '@renderer/assets/images/apps/qingyan.png?url'
import SparkDeskAppLogo from '@renderer/assets/images/apps/sparkdesk.webp?url'
import TiangongAiLogo from '@renderer/assets/images/apps/tiangong.png?url'
import WPSLingXiLogo from '@renderer/assets/images/apps/wpslingxi.webp?url'
import XiaoYiAppLogo from '@renderer/assets/images/apps/xiaoyi.webp?url'
import TencentYuanbaoAppLogo from '@renderer/assets/images/apps/yuanbao.webp?url'
import YuewenAppLogo from '@renderer/assets/images/apps/yuewen.png?url'
import LingoWhaleLogo from '@renderer/assets/images/apps/yujing.png?url'
import ZenVideoLogo from '@renderer/assets/images/apps/zenvideo.png?url'
import ZhihuAppLogo from '@renderer/assets/images/apps/zhihu.png?url'
import HailuoModelLogo from '@renderer/assets/images/models/hailuo.png?url'
import QwenModelLogo from '@renderer/assets/images/models/qwen.png?url'
import DeepSeekProviderLogo from '@renderer/assets/images/providers/deepseek.png?url'
import MinApp from '@renderer/components/MinApp'
import { MinAppType, SubjectTypes } from '@renderer/types'

export const DEFAULT_MIN_APPS: MinAppType[] = [
  // {
  //   id: 'openai',
  //   name: 'ChatGPT',
  //   url: 'https://chatgpt.com/',
  //   logo: OpenAiProviderLogo,
  //   bodered: true,
  //   group: 'AI大模型',
  //   desc: 'OpenAI开发的通用对话型AI',
  //   subject: [
  //     SubjectTypes.CHINESE,
  //     SubjectTypes.MATH,
  //     SubjectTypes.ENGLISH,
  //     SubjectTypes.PHYSICS,
  //     SubjectTypes.CHEMISTRY,
  //     SubjectTypes.INFORMATION_SCIENCE,
  //     SubjectTypes.INFORMATION_TECHNOLOGY,
  //     SubjectTypes.STEM
  //   ]
  // },
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
    desc: '深度求索公司研发的智能对话系统',
    subject: [
      SubjectTypes.CHINESE,
      SubjectTypes.MATH,
      SubjectTypes.ENGLISH,
      SubjectTypes.PHYSICS,
      SubjectTypes.CHEMISTRY,
      SubjectTypes.HISTORY,
      SubjectTypes.BIOLOGY,
      SubjectTypes.GEOGRAPHY,
      SubjectTypes.INFORMATION_SCIENCE,
      SubjectTypes.GENERAL_TECHNOLOGY,
      SubjectTypes.SCIENCE,
      SubjectTypes.STEM
    ]
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    url: 'https://chatglm.cn/main/alltoolsdetail',
    logo: ZhipuProviderLogo,
    group: 'AI大模型',
    desc: '智谱AI开发的多模态对话模型',
    subject: [SubjectTypes.MATH, SubjectTypes.PHYSICS, SubjectTypes.CHEMISTRY, SubjectTypes.INFORMATION_SCIENCE]
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
    desc: '字节跳动推出的AI对话助手',
    subject: [SubjectTypes.CHINESE, SubjectTypes.ENGLISH]
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
    desc: '百度研发的生成式对话模型',
    subject: [SubjectTypes.CHINESE]
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
    desc: '讯飞星火认知大模型平台',
    subject: [SubjectTypes.CHEMISTRY, SubjectTypes.HISTORY, SubjectTypes.BIOLOGY, SubjectTypes.GEOGRAPHY]
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
    id: 'xiaoyi',
    name: '小艺',
    logo: XiaoYiAppLogo,
    url: 'https://xiaoyi.huawei.com/chat/',
    bodered: true,
    group: 'AI大模型',
    desc: '华为智能终端AI助手'
  },
  {
    id: 'zhihu',
    name: '知乎直答',
    logo: ZhihuAppLogo,
    url: 'https://zhida.zhihu.com/',
    bodered: true,
    group: 'AI大模型',
    desc: '知乎问答社区AI'
  },
  {
    id: 'baidu-ai-search',
    name: '百度AI搜索',
    logo: BaiduAiSearchLogo,
    url: 'https://chat.baidu.com/',
    bodered: true,
    style: { padding: 5 },
    group: '搜索引擎',
    desc: '百度推出的AI增强搜索引擎'
  },
  {
    id: 'metaso',
    name: '秘塔AI搜索',
    logo: MetasoAppLogo,
    url: 'https://metaso.cn/',
    group: '搜索引擎',
    desc: 'AI驱动的专业搜索引擎'
  },
  {
    id: 'tiangong-ai',
    name: '天工AI',
    logo: TiangongAiLogo,
    url: 'https://www.tiangong.cn/',
    bodered: true,
    group: '搜索引擎',
    desc: '昆仑万维研发的智能助手'
  },
  {
    id: 'nm-search',
    name: '纳米AI搜索',
    logo: NamiAiSearchLogo,
    url: 'https://www.n.cn/',
    bodered: true,
    group: '搜索引擎',
    desc: '精准答案型AI搜索引擎'
  },
  {
    id: 'hika',
    name: 'Hika',
    logo: HikaLogo,
    url: 'https://hika.fyi/',
    bodered: true,
    group: '搜索引擎',
    desc: '知识图谱增强搜索工具'
  },
  {
    id: 'canva',
    name: '可画',
    logo: CanvaAppLogo,
    url: 'https://www.canva.com',
    bodered: false,
    group: '办公套件',
    desc: 'Canva可画是一款助力用户轻松创建并分享专业设计的工具。它拥有丰富的功能和多样模板，无论是个人设计还是团队协作，都能满足需求，是设计领域的得力助手',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'wpslingxi',
    name: 'WPS灵犀',
    logo: WPSLingXiLogo,
    url: 'https://copilot.wps.cn/',
    bodered: true,
    group: '办公套件',
    desc: '金山办公AI企业智能办公助手，能帮你写文章、生成与美化PPT、分析处理数据等'
  },
  {
    id: 'islide',
    name: 'iSlide',
    logo: ISlideLogo,
    url: 'https://www.islide.cc/',
    bodered: true,
    group: 'PPT与视频',
    desc: 'AI辅助PPT制作，一键生成，个性化编辑'
  },
  {
    id: 'aippt',
    name: 'AiPPT',
    logo: AiPPTLogo,
    url: 'https://www.aippt.cn/',
    bodered: true,
    group: 'PPT与视频',
    desc: 'AI助力，高效制作优质PPT演示文稿'
  },
  {
    id: 'boardmix',
    name: '博思白板',
    logo: BoardmixLogo,
    url: 'https://boardmix.cn/ai-whiteboard/',
    bodered: true,
    group: '思维导图',
    desc: '智能生成文字与思维导图，助力创意思维'
  },
  {
    id: 'mindmaster',
    name: '亿图脑图',
    logo: MindMasterLogo,
    url: 'https://mm.edrawsoft.cn/app/create',
    bodered: false,
    group: '思维导图',
    desc: 'AI辅助思维导图工具'
  },
  {
    id: 'lingowhale',
    name: '语鲸',
    logo: LingoWhaleLogo,
    url: 'https://lingowhale.com/home',
    bodered: true,
    group: '办公套件',
    desc: '语鲸是一款AI阅读工具，通过智能总结、问答、思维导图等功能，帮助用户快速把握文章核心内容和结构',
    subject: [SubjectTypes.CHINESE, SubjectTypes.ENGLISH]
  },
  {
    id: 'laihua',
    name: '来画',
    logo: LaiHuaLogo,
    url: 'https://www.laihua.com/',
    bodered: false,
    group: 'PPT与视频',
    desc: '动画与AI数字人智能创作平台',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'zenvideo',
    name: '腾讯智影',
    logo: ZenVideoLogo,
    url: 'https://zenvideo.qq.com/',
    bodered: true,
    group: 'PPT与视频',
    desc: '腾讯智影融合多种AIGC能力，提供丰富功能与海量素材，助力智能视频创作'
  },
  {
    id: 'coze',
    name: 'Coze',
    logo: CozeAppLogo,
    url: 'https://www.coze.com/space',
    bodered: true,
    group: '开发平台',
    desc: '字节跳动AI智能体开发平台',
    subject: [SubjectTypes.STEM]
  },
  {
    id: 'python-tutor',
    name: 'Python教学工具',
    logo: PythonTutorLogo,
    url: 'https://pythontutor.com/visualize.html#mode=edit',
    bodered: true,
    group: '教学工具',
    desc: 'Python Tutor是一个强大的编程学习工具，尤其适合初学者和教育工作者。它通过可视化的方式帮助用户理解代码的执行过程，使得编程学习变得更加直观和有趣',
    subject: [SubjectTypes.INFORMATION_SCIENCE]
  }
]

export function startMinAppById(id: string) {
  const app = DEFAULT_MIN_APPS.find((app) => app?.id === id)
  app && MinApp.start(app)
}
