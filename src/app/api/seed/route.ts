import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_STORIES = [
  {
    title: 'Колобок',
    description: 'Русская народная сказка о весёлом колобке, который убежал от дедушки и бабушки',
    category: 'Русские народные',
    ageRange: '3-6',
    author: 'Народная',
    duration: 5,
    coverImage: '/stories/kolobok.png',
    pages: [
      {
        pageNumber: 1,
        text: 'Жили-были дед да баба. Вот и просит дед:\n— Испеки мне, бабка, колобок!\nБабка по сусекам поскребла, по амбару помела, и набралось муки горсти две.',
        illustrationPrompt: 'Old man and old woman in a cozy Russian village house, warm colors, children book illustration style',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Замесила бабка тесто, испекла колобок и поставила на окошко простывать. Колобок полежал-полежал, да и покатился — с окна на завалинку, с завалинки на травку, с травки на дорожку.',
        illustrationPrompt: 'A cute round bread character rolling off a window sill, Russian village house, sunny day, children book illustration',
        animationType: 'slideRight',
        animationDuration: 2.0,
      },
      {
        pageNumber: 3,
        text: 'Катится колобок по дороге, а навстречу ему заяц:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, зайка, я тебе песенку спою!',
        illustrationPrompt: 'A cute round bread character meeting a friendly bunny rabbit on a forest path, children book illustration, warm colors',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'И запел колобок:\n«Я колобок, колобок,\nПо амбару метён, по сусекам скребён,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл...»',
        illustrationPrompt: 'The cute round bread character singing to the bunny rabbit, musical notes floating, children book illustration',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 5,
        text: 'Покатился колобок дальше. Навстречу ему волк:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, серый волк, я тебе песенку спою!',
        illustrationPrompt: 'The cute round bread character meeting a big gray wolf on a forest path, children book illustration, slightly tense but not scary',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл...»\nИ покатился дальше.',
        illustrationPrompt: 'The bread character rolling away from the wolf, forest background, children book illustration style',
        animationType: 'slideRight',
        animationDuration: 2.0,
      },
      {
        pageNumber: 7,
        text: 'Навстречу ему медведь:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, мишка, я тебе песенку спою!',
        illustrationPrompt: 'The cute round bread character meeting a big brown bear in the forest, friendly looking bear, children book illustration',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: 'И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл, я от медведя ушёл...»',
        illustrationPrompt: 'The bread character singing proudly to the bear, musical notes, forest clearing, children book illustration',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 9,
        text: 'Покатился колобок дальше. Навстречу ему лиса:\n— Здравствуй, колобок! Какой ты пригожий!\n— А я от всех ушёл!',
        illustrationPrompt: 'The cute round bread character meeting a beautiful red fox, the fox looks friendly and sly, forest path, children book illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 10,
        text: 'А лиса говорит:\n— Сядь ко мне на носок, да спой ещё разок!\nКолобок прыг лисе на нос — а лиса его — ам! — и съела!',
        illustrationPrompt: 'The fox with the bread character on its nose, dramatic moment, children book illustration style, forest background',
        animationType: 'shake',
        animationDuration: 1.0,
      },
    ],
  },
  {
    title: 'Теремок',
    description: 'Сказка про зверей, которые нашли маленький домик в лесу и стали в нём жить вместе',
    category: 'Русские народные',
    ageRange: '3-6',
    author: 'Народная',
    duration: 6,
    coverImage: '/stories/teremok.png',
    pages: [
      {
        pageNumber: 1,
        text: 'Стоит в поле теремок-теремок. Он не низок, не высок, не высок. Бежит мимо мышка-норушка. Увидела теремок, остановилась и спрашивает:\n— Терем-теремок! Кто в тереме живёт?',
        illustrationPrompt: 'A cute small wooden house in a green field, a little mouse approaching, Russian fairy tale style, children book illustration',
        animationType: 'fadeIn',
        animationDuration: 2.0,
      },
      {
        pageNumber: 2,
        text: 'Никто не отзывается. Вошла мышка в теремок и стала там жить.\nПрибежала лягушка-квакушка и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! А ты кто?\n— А я лягушка-квакушка!',
        illustrationPrompt: 'A green frog standing at the door of the small wooden house, the mouse peeking out from inside, children book illustration, warm colors',
        animationType: 'slideUp',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Стали они вдвоём жить. Бежит мимо зайчик-побегайчик. Остановился и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! А ты кто?\n— А я зайчик-побегайчик!',
        illustrationPrompt: 'A cute white bunny rabbit at the door of the wooden house, mouse and frog peeking out, children book illustration',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Стали они втроём жить. Идёт мимо лисичка-сестричка. Постучала в окошко и спрашивает:\n— Терем-теремок! Кто в тереме живёт?',
        illustrationPrompt: 'A beautiful red fox knocking on the window of the small wooden house, other animals visible inside, children book illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: '— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! А ты кто?\n— А я лисичка-сестричка!\nСтали они вчетвером жить. Пришёл волчок-серый бочок.',
        illustrationPrompt: 'A gray wolf approaching the wooden house where four animals already live, children book illustration, friendly scene',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: '— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! А ты кто?\n— А я волчок-серый бочок!',
        illustrationPrompt: 'The gray wolf at the door, all the animals looking out from the windows of the small house, children book illustration',
        animationType: 'pulse',
        animationDuration: 1.5,
      },
      {
        pageNumber: 7,
        text: 'Стали они впятером жить. Вот идут они все и видят — идёт медведь косолапый.\n— Терем-теремок! Кто в тереме живёт?',
        illustrationPrompt: 'A big brown bear approaching the small wooden house, all five animals watching from inside with worried expressions, children book illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: '— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! Я, волчок-серый бочок! А ты кто?\n— А я медведь косолапый!',
        illustrationPrompt: 'The bear towering over the small wooden house, all the animals looking nervous, children book illustration, humorous',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 9,
        text: 'Медведь влез на крышу и давай топтать — теремок и развалился! Еле-еле все успели выскочить.',
        illustrationPrompt: 'The small wooden house breaking apart with the bear on top, all the animals running out, children book illustration, not scary',
        animationType: 'shake',
        animationDuration: 2.0,
      },
      {
        pageNumber: 10,
        text: 'Потом все вместе построили новый теремок — большой и просторный. И стали жить-поживать да добра наживать!',
        illustrationPrompt: 'All six animals standing in front of a beautiful new big house they built together, happy ending, children book illustration, warm colors',
        animationType: 'fadeIn',
        animationDuration: 2.0,
      },
    ],
  },
  {
    title: 'Репка',
    description: 'Сказка про дедку, который посадил репку — выросла репка большая-пребольшая!',
    category: 'Русские народные',
    ageRange: '2-5',
    author: 'Народная',
    duration: 4,
    coverImage: '/stories/repka.png',
    pages: [
      {
        pageNumber: 1,
        text: 'Посадил дед репку. Выросла репка большая-пребольшая. Стал дед репку из земли тащить: тянет-потянет, вытянуть не может!',
        illustrationPrompt: 'An old man pulling a giant turnip in a garden, the turnip is enormous, children book illustration, warm sunny day',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Позвал дед бабку:\n— Бабка, помоги репку тянуть!\nБабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'Old woman holding onto old man, old man holding the giant turnip, pulling together, children book illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Позвала бабка внучку:\n— Внучка, помоги репку тянуть!\nВнучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A little girl holding onto old woman, chain of people pulling the giant turnip, children book illustration, funny',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Позвала внучка Жучку:\n— Жучка, помоги репку тянуть!\nЖучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A small dog added to the chain of people pulling the giant turnip, children book illustration, comical',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: 'Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A cat added to the chain of people and animals pulling the giant turnip, children book illustration, funny',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'Позвала кошка мышку:\n— Мышка, помоги репку тянуть!\nМышка за кошку, кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут... Вытянули репку!',
        illustrationPrompt: 'A tiny mouse added to the chain, the giant turnip finally coming out of the ground, all characters celebrating, children book illustration, joy',
        animationType: 'bounce',
        animationDuration: 2.0,
      },
    ],
  },
  {
    title: 'Курочка Ряба',
    description: 'Сказка про курочку, которая снесла золотое яичко, и про мышку, которая его разбила',
    category: 'Русские народные',
    ageRange: '2-4',
    author: 'Народная',
    duration: 3,
    coverImage: '/stories/ryaba.png',
    pages: [
      {
        pageNumber: 1,
        text: 'Жили-были дед да баба. И была у них курочка Ряба. Снесла курочка яичко — не простое, а золотое!',
        illustrationPrompt: 'A speckled hen standing proudly next to a glowing golden egg, cozy farmyard, children book illustration, magical',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 2,
        text: 'Дед бил-бил — не разбил. Баба била-била — не разбила. Яичко было крепкое, золотое — никак не ломалось!',
        illustrationPrompt: 'Old man and old woman trying to break the golden egg with a hammer and rolling pin, children book illustration, comical',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Мышка бежала, хвостиком махнула, яичко упало и разбилось! Плачет дед, плачет баба...',
        illustrationPrompt: 'A tiny mouse running past the golden egg, the egg falling and breaking, old man and old woman crying, children book illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'А курочка Ряба говорит:\n— Не плачь, дед! Не плачь, баба! Я снесу вам яичко не золотое, а простое!\nИ снесла курочка простое яичко. Всем было радость!',
        illustrationPrompt: 'The speckled hen with a normal white egg, old man and old woman happy and smiling, children book illustration, warm ending',
        animationType: 'fadeIn',
        animationDuration: 2.0,
      },
    ],
  },
  {
    title: 'Маша и Медведь',
    description: 'Сказка про девочку Машу, которая заблудилась в лесу и попала к медведю',
    category: 'Русские народные',
    ageRange: '4-7',
    author: 'Народная',
    duration: 7,
    coverImage: '/stories/masha.png',
    pages: [
      {
        pageNumber: 1,
        text: 'Жили-были дедушка да бабушка. Была у них внучка Машенька. Собрались раз подружки в лес по грибы да по ягоды. Пришли звать с собой и Машеньку.',
        illustrationPrompt: 'A cute little girl with braids in a Russian village, her friends calling her to go to the forest, children book illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Дедушка с бабушкой не хотели её отпускать, но Машенька упросила: «Пустили!» — и побежала с подружками в лес.',
        illustrationPrompt: 'The little girl running happily with friends into a beautiful green forest, baskets in hand, children book illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Машенька деревце за деревце, кустик за кустик — и дальше от подружек ушла. Стала кричать — никто не отзывается. Стала аукаться — никто не откликается.',
        illustrationPrompt: 'The little girl alone in the deep forest looking lost and worried, tall trees around, children book illustration',
        animationType: 'pulse',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Шла, шла Машенька и вышла к избушке. Дверь открыта. Вошла она в избушку, села на лавку. А в той избушке жил медведь!',
        illustrationPrompt: 'The little girl entering a wooden hut in the forest, cozy but mysterious, children book illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: 'Вернулся медведь и обрадовался: «Вот мне гостинец! Буду тебя держать, не пущу домой. Будешь мне печь топить, кашу варить, щи хлебать!» Заплакала Машенька.',
        illustrationPrompt: 'A big brown bear standing in the doorway of the hut, the little girl looking sad, children book illustration, not too scary',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'Стала Машенька у медведя жить. Медведь в лес пойдёт — Машеньке наказывает: «Без меня из избушки не выходи!» А Машенька всё думала, как бы ей домой вернуться.',
        illustrationPrompt: 'The bear going into the forest, the little girl looking out the window with a thinking expression, children book illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 7,
        text: 'Придумала! Испекла Машенька пирожки и говорит медведю:\n— Отнеси бабушке с дедушкой пирожки! Я пирожки в короб положу, а ты снеси их!\nМедведь согласился.',
        illustrationPrompt: 'The little girl putting pies into a big basket, the bear watching, children book illustration, clever girl',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: 'А Машенька сама в короб залезла, а сверху пирожками закрылась. Медведь взял короб и пошёл в деревню.',
        illustrationPrompt: 'The bear carrying a big basket on his back, the little girl hiding inside with pies on top, funny, children book illustration',
        animationType: 'bounce',
        animationDuration: 2.0,
      },
      {
        pageNumber: 9,
        text: 'Шёл медведь, устал, захотел сесть и пирожок съесть. А Машенька из короба кричит:\n— Вижу, вижу! Не садись на пенёк, не ешь пирожок! Неси бабушке, неси дедушке!',
        illustrationPrompt: 'The bear about to sit on a tree stump, the basket talking, funny, children book illustration, comical',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 10,
        text: 'Медведь испугался и пошёл быстрее. Принёс короб в деревню. Открыли бабушка с дедушкой короб, а там Машенька! Обрадовались все и стали жить-поживать!',
        illustrationPrompt: 'The little girl jumping out of the basket into the arms of happy grandparents, the bear looking surprised, children book illustration, joyful ending',
        animationType: 'bounce',
        animationDuration: 2.0,
      },
    ],
  },
];

export async function POST() {
  try {
    // Check if stories already exist
    const existingCount = await db.story.count();
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Stories already seeded', count: existingCount });
    }

    const created = [];
    for (const storyData of DEMO_STORIES) {
      const { pages, ...storyFields } = storyData;
      const story = await db.story.create({
        data: {
          ...storyFields,
          pages: {
            create: pages
          }
        },
        include: { pages: true }
      });
      created.push(story);
    }

    return NextResponse.json({ message: 'Stories seeded successfully', count: created.length, stories: created });
  } catch (error) {
    console.error('Error seeding stories:', error);
    return NextResponse.json({ error: 'Failed to seed stories' }, { status: 500 });
  }
}
