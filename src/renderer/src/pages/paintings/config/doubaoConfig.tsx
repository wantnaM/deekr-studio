import Image_1 from '@renderer/assets/images/paintings/recommended-1.png'
import Image_2 from '@renderer/assets/images/paintings/recommended-2.png'
import Image_3 from '@renderer/assets/images/paintings/recommended-3.png'
import Image_4 from '@renderer/assets/images/paintings/recommended-4.png'
import Image_5 from '@renderer/assets/images/paintings/recommended-5.png'
import Image_6 from '@renderer/assets/images/paintings/recommended-6.png'
import Image_7 from '@renderer/assets/images/paintings/recommended-7.png'
import Image_8 from '@renderer/assets/images/paintings/recommended-8.png'

export const TEXT_TO_IMAGES_MODELS = [
  {
    id: 'doubao-seedream-3-0-t2i-250415',
    provider: 'doubao',
    name: '豆包-Doubao-Seedream-3.0-t2i',
    group: 'Doubao'
  }
]

export type DoubaoImagesParam = {
  model: string
  prompt: string
  response_format: 'url' | 'b64_json'
  size: string
  seed: number
  guidance_scale: number
  watermark: boolean
}

export const RECOMMENDED_PROMPTS = [
  {
    id: '1',
    icon: Image_1,
    prompt:
      '胖乎乎的、可爱的、毛茸茸的小白兔，小白兔抬起头，一朵娇艳的小花轻轻飘落在它的耳朵上，乖巧而羞涩的小白兔，耳朵微微竖起，眼睛闪闪发光，露出开心的微笑。滑稽的面部表情，夸张的肢体动作，3D人物，白色背景，毛茸茸的质感，圆润的形状，卡通风格，极简主义，充满童趣的设计，获奖作品。',
    tooltip: '毛茸茸的小白兔'
  },
  {
    id: '2',
    icon: Image_2,
    prompt:
      '大面积晕染，东方水墨，水墨泼洒，国风插画，水墨，写意，吴冠中，晕染，雾气，浓雾，流体，一个拟人化的兔女孩，雪白的毛发和长长的银白色头发，戴着橙黄色的花朵装饰，穿着淡黄色的汉服，怀抱一只白色的兔子，微笑着闭眼，背景是一个巨大的满月，隐居的感觉，浓雾，桃花源，视觉冲击力，意境，东方美学，水墨丹青，古韵留白，极简主义，写意，禅意',
    tooltip: '兔子仙女'
  },
  {
    id: '3',
    icon: Image_3,
    prompt:
      '穿着蓝色衣服的模特，戴着镂空帽子，微笑，手扶在晚间，半身照，花，强烈的光影，暖光，暖色，阴影，田园，森系，前景模糊，中景特写镜头，轮廓光，高对比度的画面，高级感，复古，胶片感',
    tooltip: '田园模特'
  },
  {
    id: '4',
    icon: Image_4,
    prompt:
      '国风插画，湿墨晕染，动态曲线，透视，模糊的女人，负空间强调形式，光滑，充满活力的蓝色，彩绘服装，极简，戏剧性，虚焦，前景模糊，引人注目的基调、照片写实主义、超高清，大师级作品，艺术，粉色',
    tooltip: '国风插画'
  },
  {
    id: '5',
    icon: Image_5,
    prompt:
      '治愈系毛线猫，拟人，极简，欧美插画风的卡通形象，白色猫，背景树和山，由织物，棉花，毛毡毛绒组成，丑萌，可爱，柔软，治愈，极简，背景留白，蓝天白云的户外。超大镜头特写，证件照的构图，标题写着“带我走吧”卡通可爱的粉色英文',
    tooltip: '治愈系玩偶'
  },
  {
    id: '6',
    icon: Image_6,
    prompt:
      '蜡笔风，手绘插画，版画风格，procreate绘制丝网版画质感，造型非常简约可爱，轻叠印，儿童插画，一只粉色的超大动物与小孩在一起，背景简约aoyama的作品颜色，清新自然，画面富有童趣，简单的造型，体现灵动的设计，大小对比的应用，画面描绘着孩童与动物之间的关系，体现的和谐温馨。治愈，颗粒感，轻松的笔触，笔刷感明显',
    tooltip: '儿童插画'
  },
  {
    id: '7',
    icon: Image_7,
    prompt:
      '专注的女生，认真的高中生，认真听讲，阳光洒在她的脸上，黑板上写着数学公式，桌上摆满书本和笔记本，她专注地做笔记，周围同学在讨论，友好的课堂氛围，老师在讲台上微笑授课，活泼的面部表情，3D卡通风格，简约背景，展现知识探索的乐趣。',
    tooltip: '专注高中生'
  },
  {
    id: '8',
    icon: Image_8,
    prompt:
      '3D渲染，梦幻的配色，在一片广袤的草原上，一辆小巧的绿色巴士孤独地行驶着。天空湛蓝无云，阳光明媚。这辆巴士看起来像是在前往某个遥远的目的地，也许是一个未知的冒险之旅。它穿越着起伏的山丘，留下一道道车轮印迹。远处可以看到几只牛羊悠闲地吃草，它们对这辆突然出现的小巴毫不在意。整个场景充满了宁静和自由的气息，让人想起那些远离城市喧嚣的日子。',
    tooltip: '广袤草原'
  }
]
