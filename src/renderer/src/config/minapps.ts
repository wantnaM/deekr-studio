import AiPPTLogo from '@renderer/assets/images/apps/aippt.png?url'
import ApplicationLogo from '@renderer/assets/images/apps/application.png?url'
import AutoGLMLogo from '@renderer/assets/images/apps/autoglm.svg?url'
import BaiduAiAppLogo from '@renderer/assets/images/apps/baidu-ai.png?url'
import BoardmixLogo from '@renderer/assets/images/apps/boardmix.png?url'
import CanvaAppLogo from '@renderer/assets/images/apps/canva.jpg?url'
import ChatExcelLogo from '@renderer/assets/images/apps/chatexcel.webp?url'
import ChatPDFLogo from '@renderer/assets/images/apps/chatpdf.png?url'
import CozeAppLogo from '@renderer/assets/images/apps/coze.webp?url'
import DesignkitLogo from '@renderer/assets/images/apps/designkit.png?url'
import DoubaoAppLogo from '@renderer/assets/images/apps/doubao.png?url'
import FittenCodeLogo from '@renderer/assets/images/apps/fitten-code.png?url'
// import GeminiAppLogo from '@renderer/assets/images/apps/gemini.png?url'
import IflyrecLogo from '@renderer/assets/images/apps/iflyrec.png?url'
import ISlideLogo from '@renderer/assets/images/apps/iSlide.jpg?url'
import JiMengLogo from '@renderer/assets/images/apps/jimeng.png?url'
import KhanacademyLogo from '@renderer/assets/images/apps/khanacademy.png?url'
import KimiAppLogo from '@renderer/assets/images/apps/kimi.webp?url'
import LaiHuaLogo from '@renderer/assets/images/apps/laihua.png?url'
import MathgptLogo from '@renderer/assets/images/apps/mathgpt.jpg?url'
import MetasoAppLogo from '@renderer/assets/images/apps/metaso.webp?url'
import MindMasterLogo from '@renderer/assets/images/apps/mindmaster.png?url'
import NamiAiLogo from '@renderer/assets/images/apps/nm.png?url'
// import OpenAiProviderLogo from '@renderer/assets/images/providers/openai.png?url'
import PythonTutorLogo from '@renderer/assets/images/apps/python-tutor.png?url'
import ZhipuProviderLogo from '@renderer/assets/images/apps/qingyan.png?url'
import SciencenetLogo from '@renderer/assets/images/apps/sciencenet.png?url'
import SparkDeskAppLogo from '@renderer/assets/images/apps/sparkdesk.webp?url'
import TianYinLogo from '@renderer/assets/images/apps/tianyin.png?url'
import TreeMindLogo from '@renderer/assets/images/apps/treemind.webp?url'
import WPSLingXiLogo from '@renderer/assets/images/apps/wpslingxi.webp?url'
import XiaoHuanXiongLogo from '@renderer/assets/images/apps/xiaohuanxiong.jpg?url'
import YouYanLogo from '@renderer/assets/images/apps/youyan.webp?url'
import TencentYuanbaoAppLogo from '@renderer/assets/images/apps/yuanbao.webp?url'
import LingoWhaleLogo from '@renderer/assets/images/apps/yujing.png?url'
import ZenVideoLogo from '@renderer/assets/images/apps/zenvideo.png?url'
import ZhihuAppLogo from '@renderer/assets/images/apps/zhihu.png?url'
import ZhiWenLogo from '@renderer/assets/images/apps/zhiwen.png?url'
import ZujuanLogo from '@renderer/assets/images/apps/zujuan.webp?url'
import HailuoModelLogo from '@renderer/assets/images/models/hailuo.png?url'
import QwenModelLogo from '@renderer/assets/images/models/qwen.png?url'
import DeepSeekProviderLogo from '@renderer/assets/images/providers/deepseek.png?url'
import { MinAppType, SubjectTypes } from '@renderer/types'

// 加载自定义小应用
const loadCustomMiniApp = async (): Promise<MinAppType[]> => {
  try {
    let content: string
    try {
      content = await window.api.file.read('custom-minapps.json')
    } catch (error) {
      // 如果文件不存在，创建一个空的 JSON 数组
      content = '[]'
      await window.api.file.writeWithId('custom-minapps.json', content)
    }

    const customApps = JSON.parse(content)
    const now = new Date().toISOString()

    return customApps.map((app: any) => ({
      ...app,
      type: 'Custom',
      logo: app.logo && app.logo !== '' ? app.logo : ApplicationLogo,
      addTime: app.addTime || now
    }))
  } catch (error) {
    console.error('Failed to load custom mini apps:', error)
    return []
  }
}

// 初始化默认小应用
const ORIGIN_DEFAULT_MIN_APPS: MinAppType[] = [
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
  // {
  //   id: 'gemini',
  //   name: 'Gemini',
  //   url: 'https://gemini.google.com/',
  //   logo: GeminiAppLogo,
  //   group: 'AI大模型',
  //   desc: '谷歌开发的生成式AI对话模型'
  // },
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
    id: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com/chat/',
    logo: DoubaoAppLogo,
    group: 'AI大模型',
    desc: '字节跳动推出的AI对话助手',
    subject: [SubjectTypes.CHINESE, SubjectTypes.ENGLISH]
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
    id: 'baidu-ai-chat',
    name: '文心一言',
    logo: BaiduAiAppLogo,
    url: 'https://yiyan.baidu.com/',
    group: 'AI大模型',
    desc: '百度研发的生成式对话模型',
    subject: [SubjectTypes.CHINESE]
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
    id: 'dashscope',
    name: '通义千问',
    url: 'https://tongyi.aliyun.com/qianwen/',
    logo: QwenModelLogo,
    group: 'AI大模型',
    desc: '阿里云开发的通用大语言模型'
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
    id: 'coze',
    name: '扣子空间',
    logo: CozeAppLogo,
    url: 'https://www.coze.com/space',
    bodered: true,
    group: 'AI智能体',
    desc: '字节跳动AI智能体开发平台',
    subject: [SubjectTypes.STEM]
  },
  {
    id: 'metaso',
    name: '秘塔AI搜索',
    logo: MetasoAppLogo,
    url: 'https://metaso.cn/',
    group: 'AI搜索',
    desc: '通过AI技术实现语义理解、问题分析和信息整合，能自动生成结构化结果（如思维导图、大纲、时间线表格），并支持一键导出文件或生成演示文稿，适用于学术研究、职场办公、内容创作等场景'
  },
  {
    id: 'nm',
    name: '纳米AI搜索',
    logo: NamiAiLogo,
    url: 'https://bot.n.cn/',
    bodered: true,
    group: 'AI搜索',
    desc: '轻量化AI对话解决方案'
  },
  {
    id: 'zhihu',
    name: '知乎直答',
    logo: ZhihuAppLogo,
    url: 'https://zhida.zhihu.com/',
    bodered: true,
    group: 'AI搜索',
    desc: '知乎问答社区AI'
  },
  {
    id: 'autoglm',
    name: 'AutoGLM',
    logo: AutoGLMLogo,
    url: 'https://autoglm.zhipuai.cn/',
    bodered: false,
    group: 'AI搜索',
    desc: 'AutoGLM基于国产GLM模型，具备推理、代码和多模态能力。AutoGLM实现了云端执行，不占用用户本地设备资源，用户通过语音指令让其完成各种操作，如点外卖、订机票、查房源等',
    subject: []
  },
  {
    id: 'wpslingxi',
    name: 'WPS灵犀',
    logo: WPSLingXiLogo,
    url: 'https://copilot.wps.cn/',
    bodered: true,
    group: 'AI搜索',
    desc: '金山办公AI企业智能办公助手，能帮你写文章、生成与美化PPT、分析处理数据等'
  },
  {
    id: 'jimeng',
    name: '即梦',
    url: 'https://jimeng.jianying.com/ai-tool/home',
    logo: JiMengLogo,
    group: 'AI数字化资源生成',
    desc: '即梦AI是一个AI创作平台，可激发艺术创意、提升绘画和视频创作体验。您可以利用AI智能，将想象变为现实'
  },
  {
    id: 'minimax',
    name: '海螺',
    url: 'https://hailuoai.com/',
    logo: HailuoModelLogo,
    group: 'AI数字化资源生成',
    desc: 'MiniMax开发的智能对话产品'
  },
  {
    id: 'zenvideo',
    name: '腾讯智影',
    logo: ZenVideoLogo,
    url: 'https://zenvideo.qq.com/',
    bodered: true,
    group: 'AI数字化资源生成',
    desc: '腾讯智影融合多种AIGC能力，提供丰富功能与海量素材，助力智能视频创作',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'laihua',
    name: '来画',
    logo: LaiHuaLogo,
    url: 'https://www.laihua.com/',
    bodered: false,
    group: 'AI数字化资源生成',
    desc: '动画与AI数字人智能创作平台',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'youyan3d',
    name: '有言',
    logo: YouYanLogo,
    url: 'https://www.youyan3d.com/',
    bodered: false,
    group: 'AI数字化资源生成',
    desc: '无需拍摄剪辑，只需输入文字，即可一键生成高质量3D数字人视频。AI自动生成场景、灯光、人物和运镜，还能精准掌控每一个视频细节。高质量、高效率、低门槛、全流程可控，打造你专属的视频内容生产力',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'islide',
    name: 'iSlide',
    logo: ISlideLogo,
    url: 'https://www.islide.cc/',
    bodered: true,
    group: 'PPT生成',
    desc: 'AI辅助PPT制作，一键生成，个性化编辑'
  },
  {
    id: 'aippt',
    name: 'AiPPT',
    logo: AiPPTLogo,
    url: 'https://www.aippt.cn/',
    bodered: true,
    group: 'PPT生成',
    desc: 'AI助力，高效制作优质PPT演示文稿'
  },
  {
    id: 'motion',
    name: 'MotionGo',
    logo: MathgptLogo,
    url: 'https://motion.yoo-ai.com/',
    bodered: false,
    group: 'PPT生成',
    desc: 'MotionGo是必优科技(原口袋动画团队)全新升级的一款PPT动画插件,兼容WPS和office软件,轻量级产品,让PPT动效表达更专业'
  },
  {
    id: 'zhiwen',
    name: '讯飞智文',
    logo: ZhiWenLogo,
    url: 'https://zhiwen.xfyun.cn/home',
    bodered: false,
    group: 'PPT生成',
    desc: '讯飞智文，由科大讯飞推出的一键生成ppt/word产品。 根据一句话、长文本、音视频等指令智能生成文档，同时支持在线编辑、美化、排版、导出、一键动效、自动生成演讲稿等功能',
    subject: []
  },
  {
    id: 'boardmix',
    name: '博思白板',
    logo: BoardmixLogo,
    url: 'https://boardmix.cn/ai-whiteboard/',
    bodered: true,
    group: 'AI思维导图',
    desc: '智能生成文字与思维导图，助力创意思维'
  },
  {
    id: 'mindmaster',
    name: '亿图脑图',
    logo: MindMasterLogo,
    url: 'https://mm.edrawsoft.cn/app/create',
    bodered: false,
    group: 'AI思维导图',
    desc: 'AI辅助思维导图工具'
  },
  {
    id: 'treemind',
    name: 'TreeMind树图',
    logo: TreeMindLogo,
    url: 'https://shutu.cn/',
    bodered: false,
    group: 'AI思维导图',
    desc: 'TreeMind树图提供正版AI思维导图工具软件和免费在线脑图模板。支持脑图、逻辑图、树形图、鱼骨图、组织架构图、时间轴等多种专业格式，适合头脑风暴和创意规划'
  },
  {
    id: 'chatexcel',
    name: 'ChatExcel',
    logo: ChatExcelLogo,
    url: 'https://www.chatexcel.com/',
    bodered: false,
    group: 'AI文件处理',
    desc: 'ChatExcel AI是一款智能的Excel处理和数据分析工具，用户只需通过对话就可以实现各种表格计算、转换、模板和图表'
  },
  {
    id: 'xiaohuanxiong',
    name: '办公小浣熊',
    logo: XiaoHuanXiongLogo,
    url: 'https://office.xiaohuanxiong.com/home',
    bodered: false,
    group: 'AI文件处理',
    desc: '办公小浣熊是一款将AI大模型与文档编辑、数据分析场景深度结合的工具型产品，一站式创作平台和知识管理空间'
  },
  {
    id: 'chatpdf',
    name: 'ChatPDF',
    logo: ChatPDFLogo,
    url: 'https://www.chatpdf.com/zh',
    bodered: false,
    group: 'AI文件处理',
    desc: 'ChatPDF是一款先进的AI工具，革新了用户与PDF文件的交互方式。用户上传PDF后，可通过对话直接提问、获取摘要与关键信息。平台支持多语言PDF，适用于学术论文、法律合同、技术手册等多种文档类型'
  },
  {
    id: 'lingowhale',
    name: '语鲸',
    logo: LingoWhaleLogo,
    url: 'https://lingowhale.com/home',
    bodered: false,
    group: 'AI文件处理',
    desc: '语鲸是一款AI阅读工具，通过智能总结、问答、思维导图等功能，帮助用户快速把握文章核心内容和结构',
    subject: [SubjectTypes.CHINESE, SubjectTypes.ENGLISH]
  },
  {
    id: 'canva',
    name: '可画',
    logo: CanvaAppLogo,
    url: 'https://www.canva.com',
    bodered: false,
    group: 'AI文件处理',
    desc: 'Canva可画是一款助力用户轻松创建并分享专业设计的工具。它拥有丰富的功能和多样模板，无论是个人设计还是团队协作，都能满足需求，是设计领域的得力助手',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'designkit',
    name: '美图设计室',
    logo: DesignkitLogo,
    url: 'https://www.designkit.com',
    bodered: false,
    group: 'AI文件处理',
    desc: '让你轻松在线制作海报! 丰富的海报模板,独特的设计元素,一键生成个性化海报,让你的创意无处不在',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'tianyin',
    name: '网易天音',
    logo: TianYinLogo,
    url: 'https://tianyin.music.163.com/',
    bodered: false,
    group: 'AI音频',
    desc: '音乐爱好者或者歌手只需输入灵感，AI能辅助完成词、曲、编、唱，生成AI初稿后，支持词曲协同调整。用户无需专业音乐知识，通过选择风格、节奏等参数，快速生成个性化的音乐作品',
    subject: [SubjectTypes.ART]
  },
  {
    id: 'iflyrec',
    name: '讯飞听见',
    logo: IflyrecLogo,
    url: 'https://www.iflyrec.com/zhuanwenzi.html',
    bodered: true,
    group: 'AI音频',
    desc: '讯飞听见是一款免费在线录音转文字、语音转文字、录音整理、语音翻译的软件，支持多语种、多场景、多领域，提供高准确率、高效率、高质量的服务',
    subject: [
      SubjectTypes.INFORMATION_SCIENCE,
      SubjectTypes.ENGLISH,
      SubjectTypes.CHINESE,
      SubjectTypes.MUSIC,
      SubjectTypes.HISTORY
    ]
  },
  {
    id: 'fittentech',
    name: 'Fitten Code',
    logo: FittenCodeLogo,
    url: 'https://code.fittentech.com/try',
    bodered: false,
    group: 'AI学科应用',
    desc: 'Fitten Code是由非十大模型驱动的AI编程助手，它可以自动生成代码，提升开发效率，协助调试Bug，节省时间。还可以对话聊天，解决编程碰到的问题',
    subject: [SubjectTypes.INFORMATION_SCIENCE]
  },
  {
    id: 'python-tutor',
    name: 'Python教学工具',
    logo: PythonTutorLogo,
    url: 'https://pythontutor.com/visualize.html#mode=edit',
    bodered: true,
    group: 'AI学科应用',
    desc: 'Python Tutor是一个强大的编程学习工具，尤其适合初学者和教育工作者。它通过可视化的方式帮助用户理解代码的执行过程，使得编程学习变得更加直观和有趣',
    subject: [SubjectTypes.INFORMATION_SCIENCE]
  },
  {
    id: 'mathgpt',
    name: '九章大模型',
    logo: MathgptLogo,
    url: 'https://playground.xes1v1.cn/MathGPT',
    bodered: false,
    group: 'AI学科应用',
    desc: '学而思九章大模型（MathGPT）是好未来自主研发的，面向全球数学爱好者和科研机构，以解题和讲题算法为核心的大模型',
    subject: [SubjectTypes.MATH]
  },
  {
    id: 'sciencenet',
    name: '科学网',
    logo: SciencenetLogo,
    url: 'https://www.sciencenet.cn/',
    bodered: false,
    group: '实用网站',
    desc: '由中国科学院、中国工程院和国家自然科学基金委员会主管，中国科学报社主办的综合性科学网站，主要为网民提供快捷权威的科学新闻报道、丰富实用的科学信息服务',
    subject: []
  },
  {
    id: 'zujuan',
    name: '组卷网',
    logo: ZujuanLogo,
    url: 'https://zujuan.xkw.com/',
    bodered: true,
    group: '实用网站',
    desc: '组卷网是一个提供初高中同步备课、阶段练习、高考备考、二模等多种教学服务的在线平台',
    subject: []
  },
  {
    id: 'khanacademy',
    name: '可汗学院',
    logo: KhanacademyLogo,
    url: 'https://zh.khanacademy.org/',
    bodered: true,
    group: '实用网站',
    desc: '可汗学院是于2009年创立的教育性非营利组织，通过在线图书馆提供数学、物理、化学等学科的免费教学资源，机构使命为加快各年龄学生的学习速度',
    subject: []
  }
]

// 加载自定义小应用并合并到默认应用中
let DEFAULT_MIN_APPS = [...ORIGIN_DEFAULT_MIN_APPS, ...(await loadCustomMiniApp())]

function updateDefaultMinApps(param) {
  DEFAULT_MIN_APPS = param
}

export { DEFAULT_MIN_APPS, loadCustomMiniApp, ORIGIN_DEFAULT_MIN_APPS, updateDefaultMinApps }
