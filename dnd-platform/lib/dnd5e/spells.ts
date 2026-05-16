// Starting spells for each class at level 1.
// Cantrips and leveled spells are combined into a single known[] array
// since the character sheet doesn't distinguish them structurally.

export const SPELL_DESCRIPTIONS: Record<string, string> = {
  // Cantrips
  "Eldritch Blast":      "Shoot a beam of crackling energy at one target for 1d10 force damage. Range 120 ft.",
  "Minor Illusion":      "Create a sound or image within 30 ft that lasts 1 minute. Cannot deal damage.",
  "Fire Bolt":           "Hurl a mote of fire at a target for 1d10 fire damage. Range 120 ft.",
  "Mage Hand":           "Conjure a spectral hand to manipulate objects up to 30 ft away.",
  "Sacred Flame":        "A target in range must save DEX or take 1d8 radiant damage. Ignores cover.",
  "Guidance":            "Touch a willing creature; they add 1d4 to one ability check before the spell ends.",
  "Light":               "Touch an object to make it shed bright light in a 20 ft radius for 1 hour.",
  "Vicious Mockery":     "Hurl magical insults; target saves WIS or takes 1d4 psychic damage and has disadvantage on its next attack.",
  "Shocking Grasp":      "Melee spell attack for 1d8 lightning damage; target can't take reactions until its next turn.",
  "Prestidigitation":    "Perform minor magical tricks — light a candle, clean dirt, create a small sound or smell.",
  "Druidcraft":          "Create minor nature effects — predict weather, cause a flower to bloom, create a harmless sensory effect.",
  "Shillelagh":          "Imbue your club or staff with nature magic; use WIS for attacks and it deals 1d8 damage.",
  "Chill Touch":         "Spectral hand attack deals 1d8 necrotic damage and prevents the target from regaining HP.",
  "Ray of Frost":        "Ranged spell attack for 1d8 cold damage; target's speed reduced by 10 ft until your next turn.",
  "Thorn Whip":          "Whip of thorns attacks for 1d6 piercing damage and pulls the target 10 ft toward you.",
  "Poison Spray":        "Project a puff of noxious gas; target saves CON or takes 1d12 poison damage.",
  "Produce Flame":       "Create a flame in your hand for light; hurl it as a ranged attack for 1d8 fire damage.",
  "Resistance":          "Touch a willing creature; they add 1d4 to one saving throw before the spell ends.",
  "True Strike":         "Gain advantage on your next attack roll against one target you can see.",
  "Friends":             "Advantage on CHA checks against one non-hostile creature for 1 minute; may anger them after.",
  "Dancing Lights":      "Create up to 4 floating lights that you can move within 100 ft for up to 1 minute.",
  "Thaumaturgy":         "Manifest a minor divine wonder — booming voice, trembling ground, flashing eyes, doors slamming.",
  "Acid Splash":         "Hurl a bubble of acid; one or two adjacent targets save DEX or take 1d6 acid damage.",
  "Toll the Dead":       "A death bell tolls for a target; it saves WIS or takes 1d8 necrotic (1d12 if already hurt).",
  // 1st-Level Spells
  "Hex":                 "Curse a target: they take +1d6 necrotic on each of your hits, and disadvantage on one ability check.",
  "Hellish Rebuke":      "Reaction when hit: envelop the attacker in hellish flames for 2d10 fire damage (save halves).",
  "Mage Armor":          "Touch a willing unarmored creature; their AC becomes 13 + DEX modifier for 8 hours.",
  "Magic Missile":       "Three darts each deal 1d4+1 force damage, hitting automatically. Can target same or different creatures.",
  "Shield":              "Reaction: +5 to AC (including the triggering hit) and immunity to Magic Missile until your next turn.",
  "Sleep":               "Put creatures to sleep starting from the lowest HP; affects up to 5d8 HP of creatures.",
  "Detect Magic":        "Sense the presence of magic within 30 ft and identify which school of magic for 10 minutes.",
  "Identify":            "Learn a magic item's properties, how to use it, and any command words.",
  "Cure Wounds":         "Touch a creature to restore 1d8 + spellcasting modifier HP.",
  "Healing Word":        "Bonus action: a creature within 60 ft regains 1d4 + spellcasting modifier HP.",
  "Bless":               "Up to 3 creatures add 1d4 to attack rolls and saving throws for 1 minute (concentration).",
  "Guiding Bolt":        "Ranged spell attack for 4d6 radiant damage; the next attack roll against the target has advantage.",
  "Shield of Faith":     "A shimmering field gives one creature +2 AC for 10 minutes (concentration).",
  "Charm Person":        "Target saves WIS or is charmed by you for 1 hour, treating you as a friendly acquaintance.",
  "Faerie Fire":         "Outline objects and creatures in 20 ft cube in light; attacks against them have advantage.",
  "Dissonant Whispers":  "Target saves WIS or takes 3d6 psychic damage and flees; on success, still takes half damage.",
  "Entangle":            "Grasping weeds restrain creatures in a 20 ft square; save STR each turn to break free.",
  "Thunderwave":         "A wave of force pushes creatures within 15 ft away 10 ft; they save CON or take 2d8 thunder.",
  "Goodberry":           "Produce 10 berries, each restoring 1 HP when eaten and providing a day's nourishment.",
  "Chromatic Orb":       "Hurl a sphere of energy for 3d8 damage; choose acid, cold, fire, lightning, poison, or thunder.",
  "Burning Hands":       "A sheet of flames fans out in a 15 ft cone for 3d6 fire damage (save DEX halves).",
  "Fog Cloud":           "Create a 20 ft radius sphere of thick fog; everything inside is heavily obscured.",
  "Color Spray":         "Blinding flashes of color affect 6d10 HP of creatures — blinded until end of their next turn.",
  "Comprehend Languages": "Understand spoken or written language for 1 hour (ritual).",
  "Disguise Self":       "Change your appearance (clothes, features, height +/-1 ft) for 1 hour; others can spot it with Investigation.",
  "Expeditious Retreat": "Bonus action to Dash each turn for 10 minutes (concentration).",
  "False Life":          "Gain 1d4+4 temporary HP for 1 hour.",
  "Feather Fall":        "Reaction: up to 5 creatures fall at 60 ft/round, taking no fall damage.",
  "Grease":              "Coat a 10 ft square in grease; creatures must save DEX or fall prone.",
  "Jump":                "Triple one creature's jump distance for 1 minute.",
  "Longstrider":         "Increase one creature's speed by 10 ft for 1 hour.",
  "Protection from Evil and Good": "Celestials, fiends, fey, elementals, and undead have disadvantage against one creature for 10 min.",
  "Ray of Sickness":     "Ranged spell attack for 2d8 poison; target saves CON or is poisoned until end of its next turn.",
  "Silent Image":        "Create a visual illusion up to 15 ft cube for 10 minutes (concentration).",
  "Unseen Servant":      "Create an invisible mindless servant that follows simple commands for 1 hour (ritual).",
  "Witch Bolt":          "Ranged spell attack for 1d12 lightning; each subsequent turn, use your action for another 1d12 automatically.",
  "Animal Friendship":   "One beast saves WIS or is charmed by you for 24 hours.",
  "Bane":                "Up to 3 creatures save CHA or subtract 1d4 from attack rolls and saving throws for 1 minute.",
  "Heroism":             "A willing creature is immune to fear and gains temp HP equal to your modifier each turn for 1 minute.",
  "Tasha's Hideous Laughter": "Target saves WIS or falls prone, incapacitated laughing for 1 minute (concentration).",
  "Speak with Animals":  "Gain the ability to comprehend and verbally communicate with beasts for 10 minutes (ritual).",
  "Inflict Wounds":      "Melee spell attack for 3d10 necrotic damage.",
  "Command":             "One creature saves WIS or follows a one-word command (flee, grovel, halt, etc.) on its next turn.",
  "Create or Destroy Water": "Create 10 gallons of clean water in a container, or destroy fog/water in a 30 ft cube.",
  "Detect Evil and Good": "Sense the presence and location of celestials, fiends, fey, undead, etc. within 30 ft.",
  "Detect Poison and Disease": "Sense the presence of poisons, venomous creatures, and diseases within 30 ft.",
  "Purify Food and Drink": "All non-magical food and drink within a 5 ft sphere is purified and freed of poison and disease.",
  "Sanctuary":           "Ward a creature so attackers must save WIS before targeting it; broken if the target attacks.",
  "Illusory Script":     "Write a message only the target creature can read; others see confusing writing.",
  "Arms of Hadar":       "Tendrils of dark energy erupt around you; nearby creatures save STR or take 2d6 necrotic and lose reactions.",
  "Find Familiar":       "Summon a spirit familiar (cat, owl, raven, etc.) that can scout, relay senses, and deliver touch spells.",
}

export function getSpellDescription(name: string): string {
  return SPELL_DESCRIPTIONS[name] ?? ""
}

const STARTING_SPELLS: Record<string, string[]> = {
  Warlock: [
    "Eldritch Blast", "Minor Illusion",       // cantrips
    "Hex", "Hellish Rebuke",                  // 2 spells known
  ],
  Wizard: [
    "Fire Bolt", "Mage Hand", "Minor Illusion", // 3 cantrips
    "Mage Armor", "Magic Missile", "Shield",    // 6 spells in spellbook
    "Sleep", "Detect Magic", "Identify",
  ],
  Cleric: [
    "Sacred Flame", "Guidance", "Light",         // 3 cantrips
    "Cure Wounds", "Healing Word", "Bless",      // prepared spells
    "Guiding Bolt", "Shield of Faith",
  ],
  Bard: [
    "Vicious Mockery", "Minor Illusion",         // 2 cantrips
    "Charm Person", "Healing Word",              // 4 spells known
    "Faerie Fire", "Dissonant Whispers",
  ],
  Sorcerer: [
    "Fire Bolt", "Shocking Grasp", "Minor Illusion", "Prestidigitation", // 4 cantrips
    "Magic Missile", "Chromatic Orb",                                     // 2 spells known
  ],
  Druid: [
    "Druidcraft", "Shillelagh",                  // 2 cantrips
    "Cure Wounds", "Entangle", "Goodberry", "Thunderwave", // prepared spells
  ],
  // Paladin and Ranger gain spellcasting at level 2 — no spells at level 1
  Paladin: [],
  Ranger:  [],
  // Non-spellcasters
  Fighter:   [],
  Rogue:     [],
  Barbarian: [],
  Monk:      [],
}

export function getStartingSpells(cls: string): string[] {
  return STARTING_SPELLS[cls] ?? []
}
