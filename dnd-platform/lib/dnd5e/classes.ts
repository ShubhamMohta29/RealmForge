export interface ClassDefinition {
  name: string
  hitDie: number
  primaryAbility: string
  savingThrows: string[]
  armorProficiencies: string[]
  weaponProficiencies: string[]
  skillChoices: { count: number; options: string[] }
  isSpellcaster: boolean
  spellAbility?: string
  startingHp: number
  features: Record<number, string[]>
}

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Fighter
  'Fighting Style':           'Choose a combat specialty (Archery, Defense, Dueling, etc.) for a permanent passive bonus.',
  'Second Wind':              'Bonus action: regain 1d10 + Fighter level HP. Recharges on a short rest.',
  'Action Surge':             'Take one extra action on your turn. Recharges on a short rest.',
  'Martial Archetype':        'Choose a subclass (Champion, Battle Master, Eldritch Knight) granting a fighting specialty.',
  'Extra Attack':             'Attack twice (instead of once) whenever you take the Attack action.',
  // Wizard
  'Spellcasting':             'Cast spells from your class list using your spellcasting ability.',
  'Arcane Recovery':          'Once per long rest, recover expended spell slots totaling up to half your Wizard level.',
  'Arcane Tradition':         'Choose a school of magic subclass (Evocation, Illusion, etc.) for specialized bonuses.',
  'Arcane Tradition Feature': 'Gain an additional power from your chosen Arcane Tradition.',
  // Rogue
  'Expertise':                'Double your proficiency bonus on two chosen skills.',
  'Sneak Attack':             'Deal extra damage (1d6, scaling) once per turn when you have advantage or an ally adjacent to your target.',
  "Thieves' Cant":            'Know the secret criminal language; pass hidden messages only other rogues understand.',
  'Cunning Action':           'Use a bonus action to Dash, Disengage, or Hide each turn.',
  'Roguish Archetype':        'Choose a subclass (Thief, Assassin, Arcane Trickster) for specialized abilities.',
  'Uncanny Dodge':            'Reaction: halve the damage of one attack you can see hitting you.',
  // Cleric
  'Divine Domain':            'Choose a deity domain (Life, Light, War, etc.) granting bonus spells and domain powers.',
  'Channel Divinity':         'Use a powerful divine ability once per short rest — includes Turn Undead and a domain-specific power.',
  'Divine Domain Feature':    'Gain an additional power from your chosen Divine Domain.',
  'Destroy Undead':           'When you use Turn Undead, weak undead are instantly destroyed instead of fled.',
  // Ranger
  'Favored Enemy':            'Advantage on Survival checks to track one enemy type; learn one of their languages.',
  'Natural Explorer':         'Expertise in one terrain type; ignore difficult terrain and suffer no travel penalties there.',
  'Ranger Archetype':         'Choose a subclass (Hunter, Beast Master, Gloom Stalker) for specialized combat abilities.',
  'Primeval Awareness':       'Spend a spell slot to sense your favored enemies within 1 mile (6 miles in favored terrain).',
  // Paladin
  'Divine Sense':             'Detect celestials, fiends, and undead within 60 ft as an action. Uses = 1 + CHA modifier.',
  'Lay on Hands':             'Touch to heal from a pool of HP equal to 5× your Paladin level. Fully restored on long rest.',
  'Divine Smite':             'Expend a spell slot on a hit to add 2d8 radiant damage (+1d8 per slot level above 1st).',
  'Divine Health':            'Your divine connection makes you immune to disease.',
  'Sacred Oath':              'Swear an oath (Devotion, Vengeance, Ancients) granting oath spells and powerful abilities.',
  // Bard
  'Bardic Inspiration':       'Give an ally a d6 die as a bonus action; they add it to one roll within 10 minutes.',
  'Jack of All Trades':       'Add half your proficiency bonus to any ability check you are not already proficient in.',
  'Song of Rest':             'During a short rest, allies who spend Hit Dice regain 1d6 extra HP.',
  'Bard College':             'Choose a college (Lore, Valor, Swords) granting extra proficiencies and abilities.',
  'Bardic Inspiration d8':    'Your Bardic Inspiration die upgrades from d6 to d8.',
  'Font of Inspiration':      'Regain all uses of Bardic Inspiration on a short or long rest.',
  // Barbarian
  'Rage':                     'Bonus action: enter a rage for 1 min — resistance to physical damage, +2 STR attack/damage, advantage on STR checks.',
  'Unarmored Defense':        'While unarmored, your AC equals 10 + DEX modifier + CON modifier.',
  'Reckless Attack':          'Grant yourself advantage on attacks this turn, but enemies have advantage on attacks against you.',
  'Danger Sense':             'Advantage on DEX saving throws against effects you can see (traps, spells, explosions).',
  'Primal Path':              'Choose a subclass (Berserker, Totem Warrior, Storm Herald) for a specialized rage power.',
  'Fast Movement':            'Speed increases by 10 ft when not wearing heavy armor.',
  // Druid
  'Druidic':                  'Know the secret druidic language; you can leave hidden messages in nature only druids can read.',
  'Wild Shape':               'Transform into a beast you have seen (max CR ¼ at L2). Twice per short rest.',
  'Druid Circle':             'Choose a circle (Land, Moon, Spores) granting bonus spells and enhanced Wild Shape options.',
  'Wild Shape Improvement':   'Access more powerful beast forms for Wild Shape (CR ½ and eventually CR 1).',
  // Monk
  'Martial Arts':             'Use DEX for unarmed strikes; they deal 1d4 and count as monk weapons.',
  'Ki':                       'Pool of Ki points (= Monk level) to fuel Flurry of Blows, Patient Defense, or Step of the Wind.',
  'Unarmored Movement':       'Speed increases by 10 ft (scaling) when not wearing armor or a shield.',
  'Monastic Tradition':       'Choose a subclass (Open Hand, Shadow, Four Elements) for Ki-powered specializations.',
  'Deflect Missiles':         'Reaction: reduce ranged weapon damage by 1d10+DEX+level; if reduced to 0, throw it back.',
  'Slow Fall':                'Reaction: reduce fall damage by 5× your Monk level.',
  'Stunning Strike':          'Spend 1 Ki after hitting; target must save CON or be stunned until the start of your next turn.',
  // Sorcerer
  'Sorcerous Origin':         'Choose your innate magic source (Draconic Bloodline, Wild Magic) for signature powers.',
  'Font of Magic':            'Pool of Sorcery Points (= level) to convert into spell slots or fuel Metamagic options.',
  'Metamagic':                'Learn two ways to modify spells (Twin, Empower, Quicken, Extend, etc.).',
  // Warlock
  'Otherworldly Patron':      'Bound to a powerful entity (Archfey, Fiend, Great Old One) that grants you spells and power.',
  'Pact Magic':               'Cast warlock spells via Charisma — few slots but they fully recharge on a short rest.',
  'Eldritch Invocations':     'Learn two permanent magical boons (e.g., see in darkness, cast Disguise Self at will).',
  'Pact Boon':                'Your patron grants a boon: a bound weapon, a familiar, a magical tome, or an amulet.',
  // Generic fallback — used when a feature has no specific entry
  'Ability Score Improvement':'Increase one ability score by 2, or two different scores by 1 each.',
}

export const CLASSES: Record<string, ClassDefinition> = {
  Fighter: {
    name: 'Fighter', hitDie: 10, primaryAbility: 'str',
    savingThrows: ['str', 'con'],
    armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    skillChoices: { count: 2, options: ['acrobatics','animal_handling','athletics','history','insight','intimidation','perception','survival'] },
    isSpellcaster: false,
    startingHp: 10,
    features: {
      1: ['Fighting Style', 'Second Wind'],
      2: ['Action Surge'],
      3: ['Martial Archetype'],
      4: ['Ability Score Improvement'],
      5: ['Extra Attack'],
    }
  },
  Wizard: {
    name: 'Wizard', hitDie: 6, primaryAbility: 'int',
    savingThrows: ['int', 'wis'],
    armorProficiencies: [],
    weaponProficiencies: ['daggers','darts','slings','quarterstaffs','light crossbows'],
    skillChoices: { count: 2, options: ['arcana','history','insight','investigation','medicine','religion'] },
    isSpellcaster: true, spellAbility: 'int',
    startingHp: 6,
    features: {
      1: ['Spellcasting', 'Arcane Recovery'],
      2: ['Arcane Tradition'],
      3: ['Arcane Tradition Feature'],
      4: ['Ability Score Improvement'],
      5: ['Arcane Tradition Feature'],
    }
  },
  Rogue: {
    name: 'Rogue', hitDie: 8, primaryAbility: 'dex',
    savingThrows: ['dex', 'int'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
    skillChoices: { count: 4, options: ['acrobatics','athletics','deception','insight','intimidation','investigation','perception','performance','persuasion','sleight_of_hand','stealth'] },
    isSpellcaster: false,
    startingHp: 8,
    features: {
      1: ['Expertise', 'Sneak Attack', "Thieves' Cant"],
      2: ['Cunning Action'],
      3: ['Roguish Archetype'],
      4: ['Ability Score Improvement'],
      5: ['Uncanny Dodge'],
    }
  },
  Cleric: {
    name: 'Cleric', hitDie: 8, primaryAbility: 'wis',
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple'],
    skillChoices: { count: 2, options: ['history','insight','medicine','persuasion','religion'] },
    isSpellcaster: true, spellAbility: 'wis',
    startingHp: 8,
    features: {
      1: ['Spellcasting', 'Divine Domain'],
      2: ['Channel Divinity', 'Divine Domain Feature'],
      3: [],
      4: ['Ability Score Improvement'],
      5: ['Destroy Undead'],
    }
  },
  Ranger: {
    name: 'Ranger', hitDie: 10, primaryAbility: 'dex',
    savingThrows: ['str', 'dex'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    skillChoices: { count: 3, options: ['animal_handling','athletics','insight','investigation','nature','perception','stealth','survival'] },
    isSpellcaster: true, spellAbility: 'wis',
    startingHp: 10,
    features: {
      1: ['Favored Enemy', 'Natural Explorer'],
      2: ['Fighting Style', 'Spellcasting'],
      3: ['Ranger Archetype', 'Primeval Awareness'],
      4: ['Ability Score Improvement'],
      5: ['Extra Attack'],
    }
  },
  Paladin: {
    name: 'Paladin', hitDie: 10, primaryAbility: 'str',
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    skillChoices: { count: 2, options: ['athletics','insight','intimidation','medicine','persuasion','religion'] },
    isSpellcaster: true, spellAbility: 'cha',
    startingHp: 10,
    features: {
      1: ['Divine Sense', 'Lay on Hands'],
      2: ['Fighting Style', 'Spellcasting', 'Divine Smite'],
      3: ['Divine Health', 'Sacred Oath'],
      4: ['Ability Score Improvement'],
      5: ['Extra Attack'],
    }
  },
  Bard: {
    name: 'Bard', hitDie: 8, primaryAbility: 'cha',
    savingThrows: ['dex', 'cha'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
    skillChoices: { count: 3, options: ['acrobatics','animal_handling','arcana','athletics','deception','history','insight','intimidation','investigation','medicine','nature','perception','performance','persuasion','religion','sleight_of_hand','stealth','survival'] },
    isSpellcaster: true, spellAbility: 'cha',
    startingHp: 8,
    features: {
      1: ['Spellcasting', 'Bardic Inspiration'],
      2: ['Jack of All Trades', 'Song of Rest'],
      3: ['Bard College', 'Expertise'],
      4: ['Ability Score Improvement'],
      5: ['Bardic Inspiration d8', 'Font of Inspiration'],
    }
  },
  Barbarian: {
    name: 'Barbarian', hitDie: 12, primaryAbility: 'str',
    savingThrows: ['str', 'con'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['simple', 'martial'],
    skillChoices: { count: 2, options: ['animal_handling','athletics','intimidation','nature','perception','survival'] },
    isSpellcaster: false,
    startingHp: 12,
    features: {
      1: ['Rage', 'Unarmored Defense'],
      2: ['Reckless Attack', 'Danger Sense'],
      3: ['Primal Path'],
      4: ['Ability Score Improvement'],
      5: ['Extra Attack', 'Fast Movement'],
    }
  },
  Druid: {
    name: 'Druid', hitDie: 8, primaryAbility: 'wis',
    savingThrows: ['int', 'wis'],
    armorProficiencies: ['light', 'medium', 'shields'],
    weaponProficiencies: ['clubs','daggers','darts','javelins','maces','quarterstaffs','scimitars','sickles','slings','spears'],
    skillChoices: { count: 2, options: ['arcana','animal_handling','insight','medicine','nature','perception','religion','survival'] },
    isSpellcaster: true, spellAbility: 'wis',
    startingHp: 8,
    features: {
      1: ['Druidic', 'Spellcasting'],
      2: ['Wild Shape', 'Druid Circle'],
      3: [],
      4: ['Wild Shape Improvement', 'Ability Score Improvement'],
      5: [],
    }
  },
  Monk: {
    name: 'Monk', hitDie: 8, primaryAbility: 'dex',
    savingThrows: ['str', 'dex'],
    armorProficiencies: [],
    weaponProficiencies: ['simple', 'shortswords'],
    skillChoices: { count: 2, options: ['acrobatics','athletics','history','insight','religion','stealth'] },
    isSpellcaster: false,
    startingHp: 8,
    features: {
      1: ['Unarmored Defense', 'Martial Arts'],
      2: ['Ki', 'Unarmored Movement'],
      3: ['Monastic Tradition', 'Deflect Missiles'],
      4: ['Ability Score Improvement', 'Slow Fall'],
      5: ['Extra Attack', 'Stunning Strike'],
    }
  },
  Sorcerer: {
    name: 'Sorcerer', hitDie: 6, primaryAbility: 'cha',
    savingThrows: ['con', 'cha'],
    armorProficiencies: [],
    weaponProficiencies: ['daggers','darts','slings','quarterstaffs','light crossbows'],
    skillChoices: { count: 2, options: ['arcana','deception','insight','intimidation','persuasion','religion'] },
    isSpellcaster: true, spellAbility: 'cha',
    startingHp: 6,
    features: {
      1: ['Spellcasting', 'Sorcerous Origin'],
      2: ['Font of Magic'],
      3: ['Metamagic'],
      4: ['Ability Score Improvement'],
      5: [],
    }
  },
  Warlock: {
    name: 'Warlock', hitDie: 8, primaryAbility: 'cha',
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['light'],
    weaponProficiencies: ['simple'],
    skillChoices: { count: 2, options: ['arcana','deception','history','intimidation','investigation','nature','religion'] },
    isSpellcaster: true, spellAbility: 'cha',
    startingHp: 8,
    features: {
      1: ['Otherworldly Patron', 'Pact Magic'],
      2: ['Eldritch Invocations'],
      3: ['Pact Boon'],
      4: ['Ability Score Improvement'],
      5: [],
    }
  },
}