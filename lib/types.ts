export type Intensity = "standard" | "low";
export type ChosenExit = "blocked" | "clear";

export type ScenarioDefinition = {
  id: string;
  name: string;
  colonia: string;
  soil_type: string;
  description: string;
  is_simulated: boolean;
  created_at: string;
};

export type PretestAnswer = {
  user_id: string;
  prior_trauma: boolean;
  created_at: string;
};

export type ScenarioSession = {
  id: string;
  user_id: string;
  scenario_id: string;
  intensity: Intensity;
  chosen_exit: ChosenExit;
  reaction_time_ms: number;
  debrief: string;
  debrief_method: "ai" | "rule-based";
  created_at: string;
  scenario_definitions?: ScenarioDefinition | null;
};

export type DebriefResult = {
  text: string;
  method: "ai" | "rule-based";
};
