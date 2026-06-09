export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
};

export const quizQuestionCount = 10;
export const quizQuestionSeconds = 10;
export const quizQuestionMs = quizQuestionSeconds * 1000;

export const quizQuestions: QuizQuestion[] = [
  {
    id: "geo_001",
    category: "Places",
    question: "Which country is famous for the city of Kyoto?",
    options: ["Japan", "South Korea", "China", "Thailand"],
    answerIndex: 0,
  },
  {
    id: "geo_002",
    category: "Places",
    question: "Which city is known as the City of Love?",
    options: ["Rome", "Paris", "Venice", "Prague"],
    answerIndex: 1,
  },
  {
    id: "geo_003",
    category: "Places",
    question: "Which ocean is the largest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    answerIndex: 2,
  },
  {
    id: "geo_004",
    category: "Places",
    question: "Bali is part of which country?",
    options: ["Malaysia", "Indonesia", "Philippines", "Vietnam"],
    answerIndex: 1,
  },
  {
    id: "geo_005",
    category: "Places",
    question: "Which country has the Eiffel Tower?",
    options: ["France", "Italy", "Spain", "Germany"],
    answerIndex: 0,
  },
  {
    id: "food_001",
    category: "Food",
    question: "Sushi originally comes from which country?",
    options: ["China", "Japan", "Korea", "Vietnam"],
    answerIndex: 1,
  },
  {
    id: "food_002",
    category: "Food",
    question: "Which fruit is commonly used to make guacamole?",
    options: ["Avocado", "Mango", "Kiwi", "Papaya"],
    answerIndex: 0,
  },
  {
    id: "food_003",
    category: "Food",
    question: "Pasta is most closely associated with which country?",
    options: ["Greece", "Italy", "Mexico", "France"],
    answerIndex: 1,
  },
  {
    id: "food_004",
    category: "Food",
    question: "Which drink is made from roasted beans?",
    options: ["Tea", "Coffee", "Lemonade", "Smoothie"],
    answerIndex: 1,
  },
  {
    id: "food_005",
    category: "Food",
    question: "Which dessert is usually served frozen?",
    options: ["Brownie", "Cupcake", "Ice cream", "Pancake"],
    answerIndex: 2,
  },
  {
    id: "pop_001",
    category: "Pop Culture",
    question: "Which superhero is also known as the Dark Knight?",
    options: ["Spider-Man", "Batman", "Iron Man", "Superman"],
    answerIndex: 1,
  },
  {
    id: "pop_002",
    category: "Pop Culture",
    question: "Which movie series features Hogwarts?",
    options: ["Harry Potter", "The Hunger Games", "Twilight", "Percy Jackson"],
    answerIndex: 0,
  },
  {
    id: "pop_003",
    category: "Pop Culture",
    question: "Which music format came before streaming apps?",
    options: ["Cassette", "Cloud save", "QR code", "Podcast"],
    answerIndex: 0,
  },
  {
    id: "pop_004",
    category: "Pop Culture",
    question: "Which app is best known for short vertical videos?",
    options: ["TikTok", "LinkedIn", "Pinterest", "Dropbox"],
    answerIndex: 0,
  },
  {
    id: "pop_005",
    category: "Pop Culture",
    question: "Which fictional detective lives at 221B Baker Street?",
    options: ["Hercule Poirot", "Sherlock Holmes", "James Bond", "Lupin"],
    answerIndex: 1,
  },
  {
    id: "nature_001",
    category: "Nature",
    question: "What do bees collect from flowers?",
    options: ["Nectar", "Salt", "Sand", "Snow"],
    answerIndex: 0,
  },
  {
    id: "nature_002",
    category: "Nature",
    question: "Which animal is known for changing color?",
    options: ["Chameleon", "Penguin", "Panda", "Dolphin"],
    answerIndex: 0,
  },
  {
    id: "nature_003",
    category: "Nature",
    question: "What gas do plants absorb from the air?",
    options: ["Oxygen", "Carbon dioxide", "Helium", "Hydrogen"],
    answerIndex: 1,
  },
  {
    id: "nature_004",
    category: "Nature",
    question: "Which season usually comes after spring?",
    options: ["Winter", "Autumn", "Summer", "Monsoon"],
    answerIndex: 2,
  },
  {
    id: "nature_005",
    category: "Nature",
    question: "What is the hardest natural substance?",
    options: ["Gold", "Diamond", "Silver", "Granite"],
    answerIndex: 1,
  },
  {
    id: "daily_001",
    category: "Everyday",
    question: "How many days are in a leap year?",
    options: ["365", "366", "364", "360"],
    answerIndex: 1,
  },
  {
    id: "daily_002",
    category: "Everyday",
    question: "Which device is used to measure temperature?",
    options: ["Thermometer", "Compass", "Ruler", "Scale"],
    answerIndex: 0,
  },
  {
    id: "daily_003",
    category: "Everyday",
    question: "How many hours are in one day?",
    options: ["12", "18", "24", "30"],
    answerIndex: 2,
  },
  {
    id: "daily_004",
    category: "Everyday",
    question: "Which color do you get by mixing red and white?",
    options: ["Pink", "Green", "Purple", "Orange"],
    answerIndex: 0,
  },
  {
    id: "daily_005",
    category: "Everyday",
    question: "Which side of the road do people usually drive on in Indonesia?",
    options: ["Left", "Right", "Middle", "It changes daily"],
    answerIndex: 0,
  },
  {
    id: "sports_001",
    category: "Sports",
    question: "How many players are on a standard soccer team on the field?",
    options: ["9", "10", "11", "12"],
    answerIndex: 2,
  },
  {
    id: "sports_002",
    category: "Sports",
    question: "Which sport uses a shuttlecock?",
    options: ["Tennis", "Badminton", "Volleyball", "Golf"],
    answerIndex: 1,
  },
  {
    id: "sports_003",
    category: "Sports",
    question: "In basketball, how many points is a free throw worth?",
    options: ["1", "2", "3", "4"],
    answerIndex: 0,
  },
  {
    id: "sports_004",
    category: "Sports",
    question: "Which sport is played at Wimbledon?",
    options: ["Tennis", "Cricket", "Rugby", "Baseball"],
    answerIndex: 0,
  },
  {
    id: "sports_005",
    category: "Sports",
    question: "Which board game starts with all pieces on dark and light squares?",
    options: ["Chess", "Monopoly", "Scrabble", "Jenga"],
    answerIndex: 0,
  },
  {
    id: "music_001",
    category: "Music",
    question: "How many strings does a standard guitar usually have?",
    options: ["4", "5", "6", "8"],
    answerIndex: 2,
  },
  {
    id: "music_002",
    category: "Music",
    question: "Which instrument has black and white keys?",
    options: ["Piano", "Drum", "Violin", "Flute"],
    answerIndex: 0,
  },
  {
    id: "music_003",
    category: "Music",
    question: "What do singers use to keep tempo?",
    options: ["Metronome", "Microscope", "Telescope", "Compass"],
    answerIndex: 0,
  },
  {
    id: "music_004",
    category: "Music",
    question: "Which item is commonly used to play drums?",
    options: ["Drumsticks", "Paintbrush", "Needle", "Chopsticks only"],
    answerIndex: 0,
  },
  {
    id: "music_005",
    category: "Music",
    question: "Which word means the speed of a song?",
    options: ["Tempo", "Texture", "Volume", "Echo"],
    answerIndex: 0,
  },
  {
    id: "tech_001",
    category: "Tech",
    question: "What does Wi-Fi help devices connect to?",
    options: ["Wireless networks", "Water pipes", "Fuel tanks", "Paper folders"],
    answerIndex: 0,
  },
  {
    id: "tech_002",
    category: "Tech",
    question: "Which file type is commonly used for photos?",
    options: ["JPG", "MP3", "TXT", "ZIP only"],
    answerIndex: 0,
  },
  {
    id: "tech_003",
    category: "Tech",
    question: "What is a common use of a QR code?",
    options: ["Opening a link", "Cooking rice", "Measuring height", "Charging a phone"],
    answerIndex: 0,
  },
  {
    id: "tech_004",
    category: "Tech",
    question: "Which company makes the iPhone?",
    options: ["Apple", "Samsung", "Sony", "Nokia"],
    answerIndex: 0,
  },
  {
    id: "tech_005",
    category: "Tech",
    question: "What do you use to protect an account?",
    options: ["Password", "Wallpaper", "Playlist", "Bookmark"],
    answerIndex: 0,
  },
  {
    id: "history_001",
    category: "History",
    question: "Which ancient civilization built pyramids in Giza?",
    options: ["Egyptians", "Romans", "Vikings", "Mayans"],
    answerIndex: 0,
  },
  {
    id: "history_002",
    category: "History",
    question: "Which object is a famous symbol of ancient Rome?",
    options: ["Colosseum", "Eiffel Tower", "Taj Mahal", "Sydney Opera House"],
    answerIndex: 0,
  },
  {
    id: "history_003",
    category: "History",
    question: "Who is known for the theory of relativity?",
    options: ["Albert Einstein", "Isaac Newton", "Marie Curie", "Charles Darwin"],
    answerIndex: 0,
  },
  {
    id: "history_004",
    category: "History",
    question: "Which ship famously sank in 1912?",
    options: ["Titanic", "Mayflower", "Santa Maria", "Endeavour"],
    answerIndex: 0,
  },
  {
    id: "history_005",
    category: "History",
    question: "Which writing material was used before modern paper in ancient Egypt?",
    options: ["Papyrus", "Plastic", "Aluminum", "Rubber"],
    answerIndex: 0,
  },
  {
    id: "science_001",
    category: "Science",
    question: "What planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Mercury"],
    answerIndex: 0,
  },
  {
    id: "science_002",
    category: "Science",
    question: "What do humans need to breathe?",
    options: ["Oxygen", "Gold", "Salt", "Neon"],
    answerIndex: 0,
  },
  {
    id: "science_003",
    category: "Science",
    question: "Water freezes at what temperature in Celsius?",
    options: ["0", "10", "50", "100"],
    answerIndex: 0,
  },
  {
    id: "science_004",
    category: "Science",
    question: "Which star is closest to Earth?",
    options: ["The Sun", "Sirius", "Polaris", "Vega"],
    answerIndex: 0,
  },
  {
    id: "science_005",
    category: "Science",
    question: "What part of the body pumps blood?",
    options: ["Heart", "Lung", "Stomach", "Skin"],
    answerIndex: 0,
  },
  {
    id: "culture_001",
    category: "Culture",
    question: "Batik is strongly associated with which country?",
    options: ["Indonesia", "Canada", "Norway", "Brazil"],
    answerIndex: 0,
  },
  {
    id: "culture_002",
    category: "Culture",
    question: "Which holiday is known for costumes and trick-or-treating?",
    options: ["Halloween", "New Year", "Valentine's Day", "Earth Day"],
    answerIndex: 0,
  },
  {
    id: "culture_003",
    category: "Culture",
    question: "Which object is often used to take selfies?",
    options: ["Phone camera", "Toaster", "Printer", "Kettle"],
    answerIndex: 0,
  },
  {
    id: "culture_004",
    category: "Culture",
    question: "What do people usually blow out on a birthday cake?",
    options: ["Candles", "Coins", "Keys", "Leaves"],
    answerIndex: 0,
  },
  {
    id: "culture_005",
    category: "Culture",
    question: "Which day is commonly linked with romantic dates?",
    options: ["Valentine's Day", "April Fools' Day", "Labor Day", "World Water Day"],
    answerIndex: 0,
  },
];

export function getQuizQuestion(id: string) {
  return quizQuestions.find((question) => question.id === id) ?? null;
}

export function getQuizQuestions(ids: string[]) {
  return ids.map(getQuizQuestion).filter((question): question is QuizQuestion => Boolean(question));
}

export function pickQuizQuestionIds(count = quizQuestionCount) {
  return [...quizQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((question) => question.id);
}

export function scoreQuizAnswer(isCorrect: boolean, responseMs: number | null) {
  if (!isCorrect || responseMs === null) return 0;
  const remainingRatio = Math.max(0, Math.min(1, (quizQuestionMs - responseMs) / quizQuestionMs));
  return 100 + Math.round(remainingRatio * 50);
}
