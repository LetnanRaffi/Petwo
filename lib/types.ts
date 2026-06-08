export type Profile = {
  id: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  avatar_type: string | null;
  email: string | null;
  relationship_type: string | null;
  onboarding_completed: boolean;
};

export type Room = {
  id: string;
  invite_code: string;
  owner_id: string;
  partner_id: string | null;
  created_at: string;
};

export type Egg = {
  id: string;
  room_id: string;
  egg_type: string;
  status: "unhatched" | "hatching" | "hatched";
  hatch_progress: number;
  hatch_started_at: string | null;
  hatch_ready_at: string | null;
  hatched_at: string | null;
  pet_id: string | null;
  created_at: string;
};

export type Pet = {
  id: string;
  room_id: string;
  name: string;
  pet_type: string;
  hunger: number;
  thirst: number;
  cleanliness: number;
  energy: number;
  happiness: number;
  level: number;
  xp: number;
  updated_at: string;
};

export type RoomWallet = {
  id: string;
  room_id: string;
  coins: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  room_id: string;
  actor_id: string | null;
  action: string;
  message: string;
  created_at: string;
};

export type Mood = {
  id: string;
  room_id: string;
  user_id: string;
  mood: string;
  mood_date: string;
  created_at: string;
};

export type Journal = {
  id: string;
  room_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type MissionTaskType =
  | "mood_check"
  | "journal_entry"
  | "truth_or_dare_played"
  | "feed_pet"
  | "drink_pet"
  | "play_pet"
  | "bath_pet";

export type Mission = {
  id: string;
  room_id: string;
  assigned_to: string | null;
  task_type: MissionTaskType;
  status: "pending" | "completed";
  date: string;
  completed_at: string | null;
  reward_coins: number;
  reward_hatch_progress: number;
  reward_xp: number;
};

export type GameEvent = {
  id: string;
  room_id: string;
  actor_id: string | null;
  game_type: string;
  result: string | null;
  created_at: string;
};

export type AppState = {
  profile: Profile | null;
  room: Room | null;
  partner: Profile | null;
  egg: Egg | null;
  pet: Pet | null;
  wallet: RoomWallet | null;
  activities: Activity[];
  moods: Mood[];
  journals: Journal[];
  missions: Mission[];
  gameEvents: GameEvent[];
  hatchCelebrated: boolean;
};
