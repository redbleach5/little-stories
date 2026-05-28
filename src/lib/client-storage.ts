import type { Story, StoryPage } from '@/store/useAppStore';

const STORAGE_KEY = 'little-stories-data';

// ── Demo story data (mirrors /api/seed/route.ts) ──────────────────────────

interface DemoPage {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  animationType: string;
  animationDuration: number;
}

interface DemoStory {
  title: string;
  description: string;
  category: string;
  ageRange: string;
  author: string;
  duration: number;
  coverImage: string;
  pages: DemoPage[];
}

const DEMO_STORIES: DemoStory[] = [
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
        illustrationPrompt: 'An old man with a long white beard and an old woman in a headscarf inside a cozy Russian village house with a warm stove, the old man gesturing while the old woman scrapes the last flour from a wooden barrel, warm firelight, detailed watercolor and ink illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Замесила бабка тесто, испекла колобок и поставила на окошко простывать. Колобок полежал-полежал, да и покатился — с окна на завалинку, с завалинки на травку, с травки на дорожку.',
        illustrationPrompt: 'A cute round golden bread character with a smiling face rolling off a wooden window sill into a sunny garden, a Russian village house with carved window frames behind, the bread character looking excited, flowers on the sill, detailed watercolor and ink illustration',
        animationType: 'slideRight',
        animationDuration: 2.0,
      },
      {
        pageNumber: 3,
        text: 'Катится колобок по дороге, а навстречу ему заяц:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, зайка, я тебе песенку спою!',
        illustrationPrompt: 'The cute round golden bread character with a cheerful face meeting a fluffy gray bunny rabbit on a winding forest path, birch trees and wildflowers, dappled sunlight, both characters looking friendly, detailed watercolor and ink illustration',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'И запел колобок:\n«Я колобок, колобок,\nПо амбару метён, по сусекам скребён,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл...»',
        illustrationPrompt: 'The round golden bread character singing joyfully with arms raised, colorful musical notes floating in the air, the bunny rabbit watching in delight, a forest clearing with daisies, detailed watercolor illustration with whimsical musical notes',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 5,
        text: 'Покатился колобок дальше. Навстречу ему волк:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, серый волк, я тебе песенку спою!',
        illustrationPrompt: 'The round golden bread character meeting a tall gray wolf on a forest path, the wolf looks hungry but not frightening, dark pine trees in background, a beam of sunlight on the path, slightly tense atmosphere but safe for children, detailed watercolor and ink illustration',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл...»\nИ покатился дальше.',
        illustrationPrompt: 'The round golden bread character rolling quickly away from the disappointed gray wolf, dust clouds behind, the forest path winding ahead, the wolf looking surprised, dynamic motion, detailed watercolor illustration',
        animationType: 'slideRight',
        animationDuration: 2.0,
      },
      {
        pageNumber: 7,
        text: 'Навстречу ему медведь:\n— Колобок, колобок, я тебя съем!\n— Не ешь меня, мишка, я тебе песенку спою!',
        illustrationPrompt: 'The round golden bread character meeting a large brown bear in a forest clearing, the bear looks curious and friendly, tall pine trees and berries around, warm afternoon light, detailed watercolor and ink illustration',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: 'И запел колобок:\n«Я колобок, колобок,\nЯ от дедушки ушёл, я от бабушки ушёл,\nЯ от зайца ушёл, я от волка ушёл, я от медведя ушёл...»',
        illustrationPrompt: 'The round golden bread character singing proudly with a confident expression, musical notes filling the air, the brown bear looking impressed, a sunlit forest clearing with wildflowers, detailed watercolor illustration with golden highlights',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 9,
        text: 'Покатился колобок дальше. Навстречу ему лиса:\n— Здравствуй, колобок! Какой ты пригожий!\n— А я от всех ушёл!',
        illustrationPrompt: 'The round golden bread character meeting a beautiful red fox with a silky tail, the fox looks friendly but with a sly glint in its eye, a forest path with autumn-colored trees, warm afternoon light, detailed watercolor and ink illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 10,
        text: 'А лиса говорит:\n— Сядь ко мне на носок, да спой ещё разок!\nКолобок прыг лисе на нос — а лиса его — ам! — и съела!',
        illustrationPrompt: 'The sly red fox with the round bread character balanced on its nose, a dramatic moment with the bread character looking surprised, dark forest background with a single beam of light, autumn leaves falling, expressive characters, detailed watercolor illustration',
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
        illustrationPrompt: 'A charming small wooden house with carved window frames standing alone in a vast green meadow, a tiny gray mouse with big eyes approaching on a winding path, wildflowers everywhere, soft blue sky with fluffy clouds, detailed Russian fairy tale watercolor illustration',
        animationType: 'fadeIn',
        animationDuration: 2.0,
      },
      {
        pageNumber: 2,
        text: 'Никто не отзывается. Вошла мышка в теремок и стала там жить.\nПрибежала лягушка-квакушка и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! А ты кто?\n— А я лягушка-квакушка!',
        illustrationPrompt: 'A bright green frog with a cheerful expression standing at the carved wooden door of the small house, the gray mouse peeking out from inside with a friendly smile, flowers in window boxes, warm light from inside, detailed watercolor illustration',
        animationType: 'slideUp',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Стали они вдвоём жить. Бежит мимо зайчик-побегайчик. Остановился и спрашивает:\n— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! А ты кто?\n— А я зайчик-побегайчик!',
        illustrationPrompt: 'A fluffy white bunny rabbit with floppy ears at the wooden door, the mouse and frog looking out from the windows with happy expressions, flower garden around the house, bright sunshine, detailed watercolor and ink illustration',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Стали они втроём жить. Идёт мимо лисичка-сестричка. Постучала в окошко и спрашивает:\n— Терем-теремок! Кто в тереме живёт?',
        illustrationPrompt: 'A beautiful red fox with a bushy tail knocking on the carved window frame of the small wooden house, three animal faces visible inside looking curious, late afternoon golden light, forest beginning behind the fox, detailed watercolor illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: '— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! А ты кто?\n— А я лисичка-сестричка!\nСтали они вчетвером жить. Пришёл волчок-серый бочок.',
        illustrationPrompt: 'A tall gray wolf with kind eyes approaching the small wooden house, four animal faces watching from the windows with curiosity, evening light, forest trees in background, the scene feels friendly and welcoming, detailed watercolor and ink illustration',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: '— Терем-теремок! Кто в тереме живёт?\n— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! А ты кто?\n— А я волчок-серый бочок!',
        illustrationPrompt: 'The gray wolf standing politely at the wooden door, all four animals looking out from different windows of the house, warm interior light glowing, evening sky with stars beginning to appear, detailed watercolor illustration',
        animationType: 'pulse',
        animationDuration: 1.5,
      },
      {
        pageNumber: 7,
        text: 'Стали они впятером жить. Вот идут они все и видят — идёт медведь косолапый.\n— Терем-теремок! Кто в тереме живёт?',
        illustrationPrompt: 'A massive brown bear approaching the tiny wooden house, all five animal faces looking out from windows with worried expressions, the house seems very small next to the bear, dramatic lighting with sunset colors, detailed watercolor illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: '— Я, мышка-норушка! Я, лягушка-квакушка! Я, зайчик-побегайчик! Я, лисичка-сестричка! Я, волчок-серый бочок! А ты кто?\n— А я медведь косолапый!',
        illustrationPrompt: 'The enormous brown bear towering over the tiny wooden house, all five animals peering out nervously, the house creaking slightly, humorous and dramatic scene, warm evening light, detailed watercolor and ink illustration with expressive characters',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 9,
        text: 'Медведь влез на крышу и давай топтать — теремок и развалился! Еле-еле все успели выскочить.',
        illustrationPrompt: 'The small wooden house breaking apart with the bear tumbling on top, all five animals running out in a comical way with surprised expressions, the scene is funny not scary, clouds of dust and splinters, detailed watercolor illustration',
        animationType: 'shake',
        animationDuration: 2.0,
      },
      {
        pageNumber: 10,
        text: 'Потом все вместе построили новый теремок — большой и просторный. И стали жить-поживать да добра наживать!',
        illustrationPrompt: 'All six animals standing proudly in front of a beautiful new large wooden house they built together, the bear helping with a beam on the roof, golden sunset light, flower garden, a rainbow in the sky, happy ending, detailed watercolor illustration',
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
        illustrationPrompt: 'An old man with a white beard pulling with all his might on the green leaves of an enormous turnip half-buried in rich brown earth, the turnip is taller than the man, a sunny garden with a wooden fence, detailed watercolor and ink illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Позвал дед бабку:\n— Бабка, помоги репку тянуть!\nБабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'An old woman in a headscarf holding tightly onto the old man, who is holding the turnip leaves, both pulling with effort, their faces determined, the giant turnip still in the ground, garden vegetables around, detailed watercolor illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Позвала бабка внучку:\n— Внучка, помоги репку тянуть!\nВнучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A little girl in a red dress holding onto the old woman, forming a chain of three people pulling the enormous turnip, the turnip barely budging, comical effort expressions, a curious cat watching nearby, detailed watercolor and ink illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Позвала внучка Жучку:\n— Жучка, помоги репку тянуть!\nЖучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A small brown dog added to the chain pulling the giant turnip, four figures in a row straining and pulling, the turnip starting to wobble slightly, garden flowers and butterflies, comical scene, detailed watercolor illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: 'Позвала Жучка кошку:\n— Кошка, помоги репку тянуть!\nКошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!',
        illustrationPrompt: 'A striped cat added to the chain of people and dog pulling the giant turnip, five figures in a comic pulling chain, the turnip wobbling more, everyone making funny effort faces, detailed watercolor and ink illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'Позвала кошка мышку:\n— Мышка, помоги репку тянуть!\nМышка за кошку, кошка за Жучку, Жучка за внучку, бабка за дедку, дедка за репку — тянут-потянут... Вытянули репку!',
        illustrationPrompt: 'A tiny mouse added to the very end of the chain, the enormous turnip finally popping out of the ground with dirt flying, all six characters celebrating with joy, the turnip rolling free, golden sunset light, detailed watercolor illustration with triumphant expressions',
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
        illustrationPrompt: 'A beautiful speckled hen standing proudly next to a large glowing golden egg that radiates warm light, a cozy Russian farmyard with a wooden fence and thatched roof, magical sparkles around the egg, detailed watercolor and ink illustration with golden highlights',
        animationType: 'pulse',
        animationDuration: 2.0,
      },
      {
        pageNumber: 2,
        text: 'Дед бил-бил — не разбил. Баба била-била — не разбила. Яичко было крепкое, золотое — никак не ломалось!',
        illustrationPrompt: 'An old man hitting the golden egg with a small hammer and an old woman trying with a rolling pin, both with comical effort expressions, the egg remains intact and glowing, tools bouncing off, detailed watercolor illustration with humorous touches',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Мышка бежала, хвостиком махнула, яичко упало и разбилось! Плачет дед, плачет баба...',
        illustrationPrompt: 'A tiny mouse running past the golden egg, the egg falling off the table and cracking open, the old man and old woman with tears streaming, dramatic golden light from the broken egg, the hen watching calmly, detailed watercolor illustration',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'А курочка Ряба говорит:\n— Не плачь, дед! Не плачь, баба! Я снесу вам яичко не золотое, а простое!\nИ снесла курочка простое яичко. Всем было радость!',
        illustrationPrompt: 'The speckled hen standing proudly next to a simple white egg, the old man and old woman smiling happily and hugging each other, warm golden sunset light, a peaceful farmyard with flowers, happy ending, detailed watercolor and ink illustration',
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
        illustrationPrompt: 'A cute little girl with brown braids and a red headscarf standing in front of a Russian village house, her friends waving and calling from the edge of a green forest, baskets on their arms, warm morning light, detailed watercolor and ink illustration',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 2,
        text: 'Дедушка с бабушкой не хотели её отпускать, но Машенька упросила: «Пустили!» — и побежала с подружками в лес.',
        illustrationPrompt: 'The little girl with braids running happily with her friends into a lush green forest, sunlight filtering through tall birch and pine trees, wildflowers on the forest floor, baskets swinging, joyful atmosphere, detailed watercolor illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 3,
        text: 'Машенька деревце за деревце, кустик за кустик — и дальше от подружек ушла. Стала кричать — никто не отзывается. Стала аукаться — никто не откликается.',
        illustrationPrompt: 'The little girl with braids standing alone in the deep dark forest, looking lost and worried, tall trees creating a canopy overhead, shafts of light breaking through, mushrooms and ferns on the ground, the forest feels vast, detailed watercolor and ink illustration',
        animationType: 'pulse',
        animationDuration: 1.5,
      },
      {
        pageNumber: 4,
        text: 'Шла, шла Машенька и вышла к избушке. Дверь открыта. Вошла она в избушку, села на лавку. А в той избушке жил медведь!',
        illustrationPrompt: 'The little girl cautiously entering a cozy wooden hut deep in the forest, a warm fire in the hearth, wooden furniture, herbs hanging from the ceiling, mysterious shadows, the door is open behind her, detailed watercolor illustration with warm interior light',
        animationType: 'fadeIn',
        animationDuration: 1.5,
      },
      {
        pageNumber: 5,
        text: 'Вернулся медведь и обрадовался: «Вот мне гостинец! Буду тебя держать, не пущу домой. Будешь мне печь топить, кашу варить, щи хлебать!» Заплакала Машенька.',
        illustrationPrompt: 'A large brown bear filling the doorway of the wooden hut, the little girl sitting on a bench looking sad with tears in her eyes, the bear looks stern but not frightening, warm firelight inside, detailed watercolor illustration',
        animationType: 'slideLeft',
        animationDuration: 1.5,
      },
      {
        pageNumber: 6,
        text: 'Стала Машенька у медведя жить. Медведь в лес пойдёт — Машеньке наказывает: «Без меня из избушки не выходи!» А Машенька всё думала, как бы ей домой вернуться.',
        illustrationPrompt: 'The bear walking away into the forest with a basket, the little girl watching from the small window with a determined thinking expression, an idea forming, the hut interior visible with a warm stove, detailed watercolor and ink illustration',
        animationType: 'slideRight',
        animationDuration: 1.5,
      },
      {
        pageNumber: 7,
        text: 'Придумала! Испекла Машенька пирожки и говорит медведю:\n— Отнеси бабушке с дедушкой пирожки! Я пирожки в короб положу, а ты снеси их!\nМедведь согласился.',
        illustrationPrompt: 'The little girl carefully placing freshly baked golden pies into a large wooden box, steam rising from the pies, the bear watching with anticipation, cozy kitchen with a Russian stove, detailed watercolor illustration with warm textures',
        animationType: 'bounce',
        animationDuration: 1.5,
      },
      {
        pageNumber: 8,
        text: 'А Машенька сама в короб залезла, а сверху пирожками закрылась. Медведь взял короб и пошёл в деревню.',
        illustrationPrompt: 'The bear carrying a large wooden box on his back walking through the forest, the little girl secretly hiding inside with a clever smile, pies stacked on top as cover, comical scene with forest animals watching curiously, detailed watercolor and ink illustration',
        animationType: 'bounce',
        animationDuration: 2.0,
      },
      {
        pageNumber: 9,
        text: 'Шёл медведь, устал, захотел сесть и пирожок съесть. А Машенька из короба кричит:\n— Вижу, вижу! Не садись на пенёк, не ешь пирожок! Неси бабушке, неси дедушке!',
        illustrationPrompt: 'The bear about to sit on a tree stump with a pie in hand, the wooden box on the ground appearing to shout, the bear looking startled and confused, forest path with birch trees, comical scene, detailed watercolor illustration with expressive characters',
        animationType: 'shake',
        animationDuration: 1.5,
      },
      {
        pageNumber: 10,
        text: 'Медведь испугался и пошёл быстрее. Принёс короб в деревню. Открыли бабушка с дедушкой короб, а там Машенька! Обрадовались все и стали жить-поживать!',
        illustrationPrompt: 'The little girl jumping joyfully out of the wooden box into the arms of her happy grandparents, the bear looking shocked in the background, a Russian village with wooden houses, golden sunset, flowers and joy, detailed watercolor illustration with warm light',
        animationType: 'bounce',
        animationDuration: 2.0,
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function demoToStory(demo: DemoStory, index: number): Story {
  return {
    id: `demo-${index + 1}`,
    title: demo.title,
    description: demo.description,
    category: demo.category,
    ageRange: demo.ageRange,
    author: demo.author,
    duration: demo.duration,
    coverImage: demo.coverImage,
    isFavorite: false,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    pages: demo.pages.map((p) => ({
      id: `demo-${index + 1}-page-${p.pageNumber}`,
      pageNumber: p.pageNumber,
      text: p.text,
      illustrationUrl: '',
      illustrationPrompt: p.illustrationPrompt,
      animationType: p.animationType,
      animationDuration: p.animationDuration,
    })),
  };
}

function readStorage(): Story[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(stories: Story[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (err) {
    console.error('Error writing to localStorage:', err);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get all stories from localStorage.
 * If none exist yet, auto-seeds demo stories.
 */
export function getStories(): Story[] {
  let stories = readStorage();
  if (stories.length === 0) {
    stories = DEMO_STORIES.map((demo, i) => demoToStory(demo, i));
    writeStorage(stories);
  }
  return stories;
}

/**
 * Get a single story by id.
 */
export function getStory(id: string): Story | undefined {
  const stories = readStorage();
  return stories.find((s) => s.id === id);
}

/**
 * Save (create or update) a story in localStorage.
 * If the story has no id a new one is generated.
 * Returns the saved story.
 */
export function saveStory(story: Partial<Story> & { pages: Partial<StoryPage & { pageNumber: number }>[] }): Story {
  const stories = readStorage();
  const now = new Date().toISOString();

  const existingIndex = story.id ? stories.findIndex((s) => s.id === story.id) : -1;

  const saved: Story = {
    id: story.id || generateId(),
    title: story.title || '',
    description: story.description || '',
    category: story.category || 'Сказки',
    ageRange: story.ageRange || '3-6',
    coverImage: story.coverImage || '',
    author: story.author || 'Народная',
    duration: story.duration || 5,
    isFavorite: story.isFavorite ?? false,
    createdAt: story.createdAt || now,
    pages: story.pages.map((p, i) => ({
      id: p.id || generateId(),
      pageNumber: p.pageNumber || i + 1,
      text: p.text || '',
      illustrationUrl: p.illustrationUrl || '',
      illustrationPrompt: p.illustrationPrompt || '',
      animationType: p.animationType || 'fadeIn',
      animationDuration: p.animationDuration ?? 1.5,
    })),
  };

  if (existingIndex >= 0) {
    stories[existingIndex] = saved;
  } else {
    stories.unshift(saved);
  }

  writeStorage(stories);
  return saved;
}

/**
 * Delete a story by id from localStorage.
 */
export function deleteStory(id: string): boolean {
  const stories = readStorage();
  const filtered = stories.filter((s) => s.id !== id);
  if (filtered.length === stories.length) return false;
  writeStorage(filtered);
  return true;
}

/**
 * Update a single field (e.g. isFavorite) on a story.
 */
export function updateStory(id: string, updates: Partial<Story>): Story | undefined {
  const stories = readStorage();
  const idx = stories.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  stories[idx] = { ...stories[idx], ...updates };
  writeStorage(stories);
  return stories[idx];
}

/**
 * Explicitly seed demo stories into localStorage.
 * If stories already exist, this is a no-op (returns false).
 * Returns true if stories were seeded.
 */
export function seedDemoStories(): boolean {
  const stories = readStorage();
  if (stories.length > 0) return false;
  const seeded = DEMO_STORIES.map((demo, i) => demoToStory(demo, i));
  writeStorage(seeded);
  return true;
}
