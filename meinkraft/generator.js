// ============================================
// MINECRAFT IA - MOTEUR DE GÉNÉRATION DE STRUCTURES
// ============================================

// Base de données des structures prédéfinies
const STRUCTURES = {
    mcdonalds: {
        name: "McDonald's",
        emoji: "🍔",
        width: 21, height: 12, depth: 16,
        description: "Restaurant McDonald's complet avec cuisine, salle, comptoir et toit plat avec arches dorées",
        materials: {
            "white_concrete": 450,
            "red_concrete": 280,
            "yellow_concrete": 120,
            "gray_concrete": 200,
            "glass_pane": 85,
            "oak_planks": 180,
            "smooth_stone": 320,
            "stone_bricks": 150,
            "glowstone": 24,
            "oak_door": 4,
            "oak_stairs": 60,
            "quartz_block": 90,
            "iron_bars": 30,
            "black_concrete": 40,
            "white_wool": 60,
            "spruce_planks": 100,
            "red_carpet": 40,
            "white_carpet": 30,
            "crafting_table": 6,
            "furnace": 8,
            "barrel": 12,
            "chest": 6,
            "lantern": 10,
            "sign": 4,
            "banner": 8
        },
        steps: [
            {
                title: "🏗️ Fondations et Sol",
                desc: "Créez les fondations sur une zone de 21x16 blocs. Posez une dalle de smooth_stone sur toute la surface. Marquez l'entrée principale côté sud (largeur 6 blocs).",
                blocks: { smooth_stone: 336 }
            },
            {
                title: "🧱 Murs Extérieurs - Structure",
                desc: "Élevez les murs extérieurs sur 6 blocs de haut. Utilisez du white_concrete pour les murs principaux et du red_concrete pour la façade avant. Laissez des ouvertures pour les fenêtres (3x3 blocs).",
                blocks: { white_concrete: 380, red_concrete: 200 }
            },
            {
                title: "🪟 Fenêtres et Portes",
                desc: "Installez les glass_pane dans toutes les ouvertures prévues. Placez les oak_door aux entrées principales (2 devant, 2 côté). Ajoutez des iron_bars en décoration.",
                blocks: { glass_pane: 85, oak_door: 4, iron_bars: 30 }
            },
            {
                title: "🏠 Toit - Structure",
                desc: "Créez le toit plat avec des quartz_block. Ajoutez une bordure de red_concrete sur les bords. Le toit doit dépasser de 1 bloc tout autour.",
                blocks: { quartz_block: 90, red_concrete: 80 }
            },
            {
                title: "🍟 Arches Dorées Emblématiques",
                desc: "Construisez les célèbres arches dorées 'M' sur la façade avec du yellow_concrete. Les arches font 4 blocs de haut et 6 de large.",
                blocks: { yellow_concrete: 120 }
            },
            {
                title: "🍳 Zone Cuisine (Intérieur Arrière)",
                desc: "Aménagez la cuisine avec des furnace (grills), crafting_table (plans de travail), barrel (stockage). Le sol en smooth_stone, les murs en white_concrete.",
                blocks: { furnace: 8, crafting_table: 6, barrel: 12, smooth_stone: 80 }
            },
            {
                title: "🍔 Zone Comptoir",
                desc: "Créez le comptoir de service avec des stone_bricks. Installez des châssis lumineux (glowstone) au plafond. Ajoutez des panneaux de menu.",
                blocks: { stone_bricks: 150, glowstone: 24 }
            },
            {
                title: "🪑 Salle Principale",
                desc: "Meublez la salle avec des tables (oak_planks + oak_stairs), des bancs. Posez du red_carpet et white_carpet au sol. Ajoutez des lanternes pour l'éclairage.",
                blocks: { oak_planks: 180, oak_stairs: 60, red_carpet: 40, white_carpet: 30, lantern: 10 }
            },
            {
                title: "🪧 Façade et Signalétique",
                desc: "Ajoutez les panneaux McDonald's avec des banners jaunes et rouges. Placez des signs avec le texte. Décorez l'entrée avec des blocs lumineux.",
                blocks: { sign: 4, banner: 8, yellow_concrete: 20 }
            },
            {
                title: "🌳 Extérieur et Finitions",
                desc: "Aménagez le parking avec du gray_concrete. Ajoutez des arbres (saplings), des poubelles (barrel), et un petit drive-through. Plantez de l'herbe autour.",
                blocks: { gray_concrete: 200, barrel: 4, oak_sapling: 4 }
            }
        ],
        tips: [
            "💡 Utilisez le mode Créatif pour construire plus rapidement",
            "💡 Les arches dorées sont le détail le plus reconnaissable, prenez votre temps",
            "💡 Pensez à l'éclairage intérieur avec des glowstone cachées dans le plafond",
            "💡 Le sol de la cuisine peut être en smooth_stone pour un aspect propre",
            "💡 N'oubliez pas les toilettes à l'arrière du bâtiment !",
            "💡 Ajoutez un panneau 'McDonald's' avec des lettres en blocs"
        ]
    },
    castle: {
        name: "Château Fort Médiéval",
        emoji: "🏰",
        width: 32, height: 25, depth: 32,
        description: "Château fort complet avec donjon, tours d'angle, douves, pont-levis et intérieur aménagé",
        materials: {
            "stone_bricks": 2800,
            "cobblestone": 1200,
            "mossy_stone_bricks": 400,
            "oak_planks": 600,
            "oak_log": 300,
            "oak_door": 12,
            "iron_bars": 80,
            "torch": 60,
            "lantern": 20,
            "glass_pane": 45,
            "oak_stairs": 200,
            "oak_slab": 150,
            "oak_fence": 200,
            "water_bucket": 40,
            "red_banner": 16,
            "black_banner": 8,
            "crafting_table": 4,
            "furnace": 8,
            "chest": 16,
            "anvil": 2,
            "enchanting_table": 1,
            "brewing_stand": 2,
            "bookshelf": 24,
            "carpet": 30,
            "bed": 8,
            "armor_stand": 6,
            "painting": 12,
            "barrel": 10,
            "ladder": 100,
            "chain": 40,
            "stone_bricks_wall": 300
        },
        steps: [
            {
                title: "🏰 Fondations et Douves",
                desc: "Creusez les douves autour du château (3 blocs de profondeur, 4 de large). Posez les fondations en stone_bricks sur une zone de 32x32. Remplissez les douves d'eau.",
                blocks: { stone_bricks: 400, water_bucket: 40 }
            },
            {
                title: "🧱 Murailles Principales",
                desc: "Élevez les murs d'enceinte sur 10 blocs de haut avec des stone_bricks et cobblestone. Ajoutez un chemin de ronde en haut avec des créneaux (oak_slab).",
                blocks: { stone_bricks: 1600, cobblestone: 800, oak_slab: 150 }
            },
            {
                title: "🗼 Tours d'Angle (4 tours)",
                desc: "Construisez 4 tours circulaires aux angles (diamètre 7, hauteur 18). Utilisez stone_bricks avec des mossy_stone_bricks pour le vieillissement. Ajoutez des meurtrières.",
                blocks: { stone_bricks: 800, mossy_stone_bricks: 400, oak_stairs: 100 }
            },
            {
                title: "🚪 Porte Principale et Pont-levis",
                desc: "Construisez l'entrée monumentale avec un portail en arc. Ajoutez le pont-levis avec des oak_planks et des chain. Installez les lourdes oak_door.",
                blocks: { oak_planks: 200, chain: 40, oak_door: 8, cobblestone: 200 }
            },
            {
                title: "🏯 Donjon Central",
                desc: "Élevez le donjon au centre (10x10, hauteur 20). Il doit dépasser les murailles. Ajoutez un toit conique en oak_stairs. Placez le blason avec des bannières.",
                blocks: { stone_bricks: 600, oak_stairs: 100, red_banner: 16, black_banner: 8 }
            },
            {
                title: "🪵 Structures Intérieures",
                desc: "Créez les planchers en oak_planks, les poutres en oak_log. Divisez l'espace en salles : grande salle, armurerie, cuisine, donjon.",
                blocks: { oak_planks: 400, oak_log: 300 }
            },
            {
                title: "⚔️ Grande Salle",
                desc: "Aménagez la grande salle avec une table de banquet, des chaises, une cheminée, des trophées (armor_stand). Ajoutez des tapis et des peintures.",
                blocks: { carpet: 30, armor_stand: 6, painting: 12, oak_fence: 100 }
            },
            {
                title: "📚 Salle du Trône et Bibliothèque",
                desc: "Installez le trône, les bookshelf pour la bibliothèque, l'enchanting_table et les brewing_stand pour l'alchimiste royal.",
                blocks: { bookshelf: 24, enchanting_table: 1, brewing_stand: 2 }
            },
            {
                title: "🛏️ Chambres et Armurerie",
                desc: "Aménagez les chambres royales avec des beds, des coffres. L'armurerie avec des anvil, armor_stand et des racks d'armes.",
                blocks: { bed: 8, chest: 16, anvil: 2, barrel: 10 }
            },
            {
                title: "🔦 Éclairage et Décoration Finale",
                desc: "Placez les torch et lantern partout. Ajoutez des drapeaux aux tours, des escaliers en colimaçon (ladder), et les finitions extérieures.",
                blocks: { torch: 60, lantern: 20, ladder: 100, oak_fence: 100 }
            }
        ],
        tips: [
            "💡 Variez les blocs (stone_bricks, cobblestone, mossy) pour un rendu réaliste",
            "💡 Les tours circulaires sont plus belles que les tours carrées",
            "💡 Ajoutez de la mousse (mossy_stone_bricks) pour un vieillissement naturel",
            "💡 Les douves avec pont-levis rendent le château impressionnant",
            "💡 Pensez aux meurtrières dans les murs (fentes de 1x2 avec glass_pane)",
            "💡 Le donjon doit être le point le plus haut du château"
        ]
    },
    skyscraper: {
        name: "Gratte-ciel Moderne",
        emoji: "🏙️",
        width: 20, height: 40, depth: 20,
        description: "Immeuble moderne de 20 étages avec façade vitrée, hall d'accueil et rooftop",
        materials: {
            "white_concrete": 3200,
            "light_blue_stained_glass": 800,
            "gray_concrete": 1600,
            "iron_block": 200,
            "glowstone": 100,
            "smooth_stone": 400,
            "quartz_block": 300,
            "glass_pane": 400,
            "iron_door": 8,
            "elevator": 40,
            "redstone_lamp": 60,
            "white_carpet": 100,
            "chest": 40,
            "crafting_table": 20,
            "barrel": 20,
            "spruce_planks": 200,
            "black_concrete": 100,
            "sea_lantern": 30,
            "observer": 10,
            "piston": 10,
            "redstone": 100,
            "redstone_block": 20,
            "lever": 20,
            "button": 40
        },
        steps: [
            {
                title: "🏗️ Fondations Profondes",
                desc: "Créez des fondations solides en iron_block et gray_concrete sur 20x20. Creusez 3 blocs en profondeur pour le parking souterrain.",
                blocks: { iron_block: 200, gray_concrete: 400 }
            },
            {
                title: "🏛️ Structure Métallique",
                desc: "Élevez l'armature avec des iron_block aux coins et des gray_concrete pour le noyau central (escaliers, ascenseur).",
                blocks: { gray_concrete: 800 }
            },
            {
                title: "🪟 Façade Vitrée - Étages 1-10",
                desc: "Habillez les façades avec du light_blue_stained_glass et white_concrete. Alternance bandes vitrées/béton toutes les 2 dalles.",
                blocks: { light_blue_stained_glass: 400, white_concrete: 1600 }
            },
            {
                title: "🪟 Façade Vitrée - Étages 11-20",
                desc: "Continuez la façade avec un léger retrait pour donner l'effet de hauteur. Utilisez plus de verre et moins de béton.",
                blocks: { light_blue_stained_glass: 400, white_concrete: 1600 }
            },
            {
                title: "🏢 Hall d'Accueil (Rez-de-chaussée)",
                desc: "Créez un hall spacieux avec sol en quartz_block, accueil en smooth_stone, éclairage avec sea_lantern. Ajoutez des portes vitrées.",
                blocks: { quartz_block: 200, smooth_stone: 200, sea_lantern: 20, iron_door: 4 }
            },
            {
                title: "🪜 Escaliers et Noyau Central",
                desc: "Construisez l'escalier de secours en spirale et le noyau d'ascenseur. Utilisez des quartz_block pour les marches.",
                blocks: { quartz_block: 100, smooth_stone: 200 }
            },
            {
                title: "🏢 Aménagement des Étages",
                desc: "Créez les planchers étage par étage. Open space avec des spruce_planks pour les bureaux, des chest comme casiers.",
                blocks: { spruce_planks: 200, chest: 40, barrel: 20 }
            },
            {
                title: "💡 Éclairage LED Moderne",
                desc: "Installez des redstone_lamp encastrées dans les plafonds. Créez un système d'éclairage avec redstone et lever.",
                blocks: { redstone_lamp: 60, glowstone: 100, redstone: 100, redstone_block: 20 }
            },
            {
                title: "🔝 Rooftop et Terrasse",
                desc: "Aménagez le toit-terrasse avec des black_concrete, des bancs, un jardin (grass_block). Ajoutez un héliport.",
                blocks: { black_concrete: 100, white_carpet: 100 }
            },
            {
                title: "🌟 Éclairage Extérieur et Finitions",
                desc: "Ajoutez l'éclairage de nuit avec des sea_lantern cachées. Installez le nom du bâtiment avec des lettres en blocs. Finitions métalliques.",
                blocks: { sea_lantern: 10, iron_block: 100 }
            }
        ],
        tips: [
            "💡 Utilisez du verre teinté pour un look moderne",
            "💡 Le béton blanc donne un rendu très propre et professionnel",
            "💡 Pensez à l'éclairage de nuit avec des blocs lumineux cachés",
            "💡 Créez un ascenseur fonctionnel avec des pistons et redstone",
            "💡 Le rooftop avec jardin est un must pour les buildings modernes",
            "💡 Alternez les textures sur la façade pour éviter la monotonie"
        ]
    },
    treehouse: {
        name: "Cabane dans l'Arbre Géant",
        emoji: "🌳",
        width: 25, height: 30, depth: 25,
        description: "Maison dans un arbre géant avec multiples plateformes, ponts suspendus et toboggan",
        materials: {
            "oak_log": 800,
            "spruce_log": 400,
            "oak_planks": 600,
            "spruce_planks": 300,
            "oak_leaves": 2000,
            "oak_fence": 300,
            "oak_stairs": 200,
            "ladder": 150,
            "torch": 30,
            "lantern": 20,
            "oak_door": 6,
            "glass_pane": 40,
            "chest": 20,
            "crafting_table": 4,
            "furnace": 4,
            "bed": 4,
            "barrel": 10,
            "flower_pot": 10,
            "painting": 8,
            "carpet": 20,
            "vines": 30,
            "oak_trapdoor": 10,
            "chain": 20,
            "oak_sign": 5,
            "campfire": 4,
            "moss_carpet": 20
        },
        steps: [
            {
                title: "🌳 Le Tronc Géant",
                desc: "Plantez un mega-tronc de 3x3 blocs d'oak_log sur 20 blocs de haut. Ajoutez des racines qui dépassent à la base.",
                blocks: { oak_log: 400 }
            },
            {
                title: "🌿 Branches Principales",
                desc: "Créez 4-5 branches principales qui partent du tronc à différentes hauteurs. Chaque branche fait 8-12 blocs de long avec des spruce_log.",
                blocks: { spruce_log: 400, oak_log: 200 }
            },
            {
                title: "🏠 Plateforme Principale (Étage 1)",
                desc: "Construisez la plateforme de vie principale à 12 blocs de haut. Sol en oak_planks avec garde-corps en oak_fence.",
                blocks: { oak_planks: 300, oak_fence: 100 }
            },
            {
                title: "🛏️ Chambres (Étage 2)",
                desc: "Ajoutez 2-3 chambres sur une plateforme supérieure. Murs en spruce_planks, fenêtres avec glass_pane, lits.",
                blocks: { spruce_planks: 200, glass_pane: 40, bed: 4 }
            },
            {
                title: "🔭 Observatoire (Sommet)",
                desc: "Créez un petit observatoire au sommet avec une vue dégagée. Utilisez des oak_fence et un dôme en oak_stairs.",
                blocks: { oak_stairs: 100, oak_fence: 100 }
            },
            {
                title: "🌉 Ponts Suspendus",
                desc: "Reliez les plateformes avec des ponts en oak_planks et oak_fence. Utilisez des chain pour l'effet suspendu.",
                blocks: { oak_planks: 200, oak_fence: 100, chain: 20 }
            },
            {
                title: "🪜 Escaliers et Accès",
                desc: "Construissez des escaliers en spirale autour du tronc avec des ladder et oak_stairs. Ajoutez des trapdoors.",
                blocks: { ladder: 150, oak_stairs: 100, oak_trapdoor: 10 }
            },
            {
                title: "🪵 Aménagement Intérieur",
                desc: "Meublez chaque pièce : tables, chaises, coffres, fournaises, établi. Posez des tapis et peintures.",
                blocks: { chest: 20, crafting_table: 4, furnace: 4, carpet: 20, painting: 8, barrel: 10 }
            },
            {
                title: "🌿 Feuillage et Décoration",
                desc: "Couvrez l'arbre avec des oak_leaves. Ajoutez des vines, moss_carpet et flower_pot pour le côté naturel.",
                blocks: { oak_leaves: 2000, vines: 30, moss_carpet: 20, flower_pot: 10 }
            },
            {
                title: "🔥 Éclairage et Ambiance",
                desc: "Placez des lanternes et torches à travers l'arbre. Ajoutez des campfire au niveau du sol pour un coin feu de camp.",
                blocks: { lantern: 20, torch: 30, campfire: 4 }
            }
        ],
        tips: [
            "💡 Commencez toujours par le tronc, puis les branches, puis le feuillage",
            "💡 Utilisez 2 types de bois (oak + spruce) pour varier les textures",
            "💡 Les ponts suspendus avec chaînes donnent un effet génial",
            "💡 Cachez l'éclairage dans les feuilles pour un effet magique la nuit",
            "💡 Ajoutez un toboggan (water + soul_sand) pour descendre vite !",
            "💡 Le campfire au pied de l'arbre crée une ambiance parfaite"
        ]
    },
    pirate_ship: {
        name: "Navire Pirate",
        emoji: "🏴‍☠️",
        width: 12, height: 18, depth: 30,
        description: "Bateau pirate détaillé avec ponts, cabine du capitaine, canons et mâture",
        materials: {
            "dark_oak_planks": 800,
            "spruce_planks": 400,
            "oak_planks": 300,
            "spruce_log": 200,
            "oak_fence": 200,
            "oak_stairs": 150,
            "white_wool": 100,
            "black_wool": 40,
            "red_wool": 30,
            "chain": 60,
            "oak_door": 4,
            "chest": 12,
            "barrel": 16,
            "torch": 10,
            "lantern": 8,
            "ladder": 40,
            "dispenser": 8,
            "tnt": 16,
            "banner": 8,
            "painting": 6,
            "glass_pane": 10,
            "crafting_table": 2,
            "furnace": 2,
            "bed": 2,
            "anvil": 1,
            "red_carpet": 10,
            "oak_slab": 100
        },
        steps: [
            {
                title: "⚓ Coque du Bateau",
                desc: "Construisez la coque en forme de navire avec des dark_oak_planks. La partie basse est plus étroite, s'élargit au milieu et se rétrécit à la proue.",
                blocks: { dark_oak_planks: 600 }
            },
            {
                title: "🪵 Pont Principal",
                desc: "Créez le pont principal en oak_planks. Ajoutez les garde-corps en oak_fence tout autour du navire.",
                blocks: { oak_planks: 200, oak_fence: 150 }
            },
            {
                title: "🏠 Cabine du Capitaine",
                desc: "Construisez la cabine à l'arrière avec des spruce_planks. Ajoutez une fenêtre en glass_pane et une oak_door.",
                blocks: { spruce_planks: 200, glass_pane: 10, oak_door: 2 }
            },
            {
                title: "🏗️ Mât Principal",
                desc: "Élevez le grand mât au centre avec des spruce_log (haut de 15 blocs). Ajoutez les vergues (cross-beams) en oak_slab.",
                blocks: { spruce_log: 100, oak_slab: 60 }
            },
            {
                title: "⛵ Voiles",
                desc: "Créez les voiles en white_wool. Formez des triangles/rectangles sur les vergues. Ajoutez le Jolly Roger (skull_banner) en black_wool.",
                blocks: { white_wool: 100, black_wool: 40, red_wool: 30 }
            },
            {
                title: "⚓ Proue et Étrave",
                desc: "Sculptez la proue avec une figure de proue. Utilisez des oak_stairs pour les courbes. Ajoutez le balcon du capitaine.",
                blocks: { oak_stairs: 100, dark_oak_planks: 100 }
            },
            {
                title: "💣 Canons",
                desc: "Installez les canons (dispenser) sur les côtés du navire. Placez les ouvertures dans la coque. Ajoutez des tnt comme munitions.",
                blocks: { dispenser: 8, tnt: 16 }
            },
            {
                title: "🛏️ Cabines Intérieures",
                desc: "Aménagez l'intérieur : cabine du capitaine (bed, chest, anvil), entrepôt (barrel, chest), cuisine (furnace).",
                blocks: { chest: 12, barrel: 16, bed: 2, anvil: 1, furnace: 2 }
            },
            {
                title: "🪜 Accès et Échelles",
                desc: "Ajoutez les échelles (ladder) pour monter aux mâts. Créez le capot de cale avec des oak_stairs.",
                blocks: { ladder: 40, oak_stairs: 50 }
            },
            {
                title: "🏴‍☠️ Finitions et Drapeau",
                desc: "Hissez le drapeau pirate au sommet. Ajoutez des lanternes, des barils sur le pont, et les derniers détails.",
                blocks: { lantern: 8, banner: 8, oak_fence: 50 }
            }
        ],
        tips: [
            "💡 La forme de la coque est cruciale - commencez par le profil latéral",
            "💡 Utilisez des oak_stairs pour créer des courbes réalistes sur la coque",
            "💡 Les voiles en laine blanche sont plus belles avec un peu de vent (asymétrie)",
            "💡 Les canons fonctionnent vraiment avec des dispensers et TNT !",
            "💡 Le drapeau pirate au sommet donne tout son caractère au navire",
            "💡 Placez le navire sur l'eau pour un effet spectaculaire"
        ]
    },
    volcano_lair: {
        name: "Base Secrète Volcanique",
        emoji: "🌋",
        width: 30, height: 25, depth: 30,
        description: "Base secrète cachée dans un volcan avec laboratoire, hangar à véhicules et salle de contrôle",
        materials: {
            "blackstone": 2000,
            "basalt": 1500,
            "smooth_basalt": 800,
            "deepslate_bricks": 600,
            "magma_block": 200,
            "redstone_lamp": 80,
            "iron_block": 300,
            "obsidian": 400,
            "glass_pane": 100,
            "iron_door": 10,
            "redstone": 200,
            "redstone_block": 30,
            "redstone_repeater": 40,
            "redstone_comparator": 20,
            "observer": 20,
            "piston": 30,
            "sticky_piston": 20,
            "hopper": 30,
            "dispenser": 10,
            "chest": 30,
            "barrel": 20,
            "crafting_table": 6,
            "furnace": 10,
            "blast_furnace": 4,
            "enchanting_table": 2,
            "brewing_stand": 4,
            "beacon": 2,
            "anvil": 3,
            "smithing_table": 2,
            "grindstone": 2,
            "lectern": 2,
            "target": 6,
            "tnt": 20,
            "white_concrete": 200,
            "gray_concrete": 300,
            "black_concrete": 100,
            "red_carpet": 40,
            "black_carpet": 40,
            "glowstone": 60,
            "sea_lantern": 20,
            "end_rod": 30,
            "lava_bucket": 50,
            "water_bucket": 20,
            "lever": 20,
            "button": 30
        },
        steps: [
            {
                title: "🌋 Construction du Volcan",
                desc: "Créez la montagne volcanique avec des blackstone et basalt. Formez un cratère au sommet. La base doit faire 30x30 au sol.",
                blocks: { blackstone: 2000, basalt: 1500, smooth_basalt: 800 }
            },
            {
                title: "🔥 Cratère et Lave",
                desc: "Remplissez le cratère avec de la lave (lava_bucket). Ajoutez des magma_block autour pour l'effet de chaleur.",
                blocks: { lava_bucket: 50, magma_block: 200 }
            },
            {
                title: "🚪 Entrée Secrète",
                desc: "Créez une entrée cachée dans la montagne avec un mécanisme piston (sticky_piston + redstone). L'entrée doit être invisible depuis l'extérieur.",
                blocks: { sticky_piston: 20, redstone: 100, observer: 20, piston: 30 }
            },
            {
                title: "🏢 Hall Principal",
                desc: "Creusez et aménagez un grand hall avec des murs en deepslate_bricks, sol en smooth_basalt. Plafond haut avec éclairage dramatique.",
                blocks: { deepslate_bricks: 600, smooth_basalt: 400, end_rod: 30 }
            },
            {
                title: "🔬 Laboratoire",
                desc: "Créez le labo high-tech avec des brewing_stand, enchanting_table, et tables de craft. Murs blancs, éclairage intense.",
                blocks: { white_concrete: 200, sea_lantern: 20, brewing_stand: 4, enchanting_table: 2 }
            },
            {
                title: "🛡️ Salle de Contrôle",
                desc: "Installez le centre de commande avec des cibles (target) comme boutons, écrans (glass_pane), et systèmes redstone.",
                blocks: { target: 6, glass_pane: 100, redstone_repeater: 40, redstone_comparator: 20, lever: 20, button: 30 }
            },
            {
                title: "🚗 Hangar à Véhicules",
                desc: "Construisez un grand hangar pour les véhicules/machines. Porte automatique avec pistons. Sol en iron_block.",
                blocks: { iron_block: 300, iron_door: 10 }
            },
            {
                title: "⚔️ Arsenal et Stockage",
                desc: "Aménagez l'arsenal avec des anvil, smithing_table, grindstone. Stockage massif avec chest et barrel.",
                blocks: { anvil: 3, smithing_table: 2, grindstone: 2, chest: 30, barrel: 20, hopper: 30 }
            },
            {
                title: "🏠 Quartiers d'Habitation",
                desc: "Créez les quartiers privés avec lits, décoration sombre. Salle de briefing avec lectern et écrans.",
                blocks: { red_carpet: 40, black_carpet: 40, lectern: 2, obsidian: 400 }
            },
            {
                title: "💡 Éclairage et Systèmes",
                desc: "Finalisez l'éclairage avec redstone_lamp et glowstone. Installez les beacons, les alarmes et le système de sécurité.",
                blocks: { redstone_lamp: 80, glowstone: 60, beacon: 2, redstone_block: 30, dispenser: 10, tnt: 20 }
            }
        ],
        tips: [
            "💡 L'entrée secrète avec pistons est le détail le plus satisfaisant",
            "💡 Utilisez les magma_block et lave pour un effet volcanique réaliste",
            "💡 Le contraste noir/rouge donne une ambiance villain parfaite",
            "💡 Les beacons avec des effets spéciaux ajoutent du style au laboratoire",
            "💡 Cachez l'éclairage derrière des blocs pour un effet dramatique",
            "💡 Pensez à ajouter un escape pod secret !"
        ]
    },
    futuristic_house: {
        name: "Maison Futuriste",
        emoji: "🏠",
        width: 18, height: 12, depth: 22,
        description: "Maison futuriste avec piscine, jardin sur le toit, garage et domotique",
        materials: {
            "white_concrete": 600,
            "black_concrete": 300,
            "light_blue_stained_glass": 200,
            "gray_concrete": 200,
            "quartz_block": 400,
            "smooth_stone": 300,
            "iron_block": 100,
            "glowstone": 40,
            "sea_lantern": 30,
            "redstone_lamp": 50,
            "redstone": 150,
            "redstone_block": 20,
            "redstone_repeater": 30,
            "observer": 10,
            "piston": 15,
            "sticky_piston": 15,
            "hopper": 10,
            "water_bucket": 30,
            "prismarine": 50,
            "dark_prismarine": 30,
            "oak_planks": 100,
            "spruce_planks": 100,
            "white_carpet": 60,
            "light_blue_carpet": 30,
            "chest": 10,
            "barrel": 10,
            "crafting_table": 3,
            "furnace": 4,
            "blast_furnace": 2,
            "iron_door": 6,
            "glass_pane": 60,
            "end_rod": 40,
            "grass_block": 40,
            "oak_sapling": 6,
            "flower": 20,
            "lever": 15,
            "button": 20
        },
        steps: [
            {
                title: "🏗️ Fondations et Structure",
                desc: "Posez les fondations en quartz_block. L'architecture est en L avec une partie à 2 étages et une à 1 étage.",
                blocks: { quartz_block: 400, gray_concrete: 200 }
            },
            {
                title: "🧱 Murs Extérieurs",
                desc: "Élevez les murs en white_concrete pour les surfaces principales et black_concrete pour les accents. Design minimaliste avec grandes ouvertures.",
                blocks: { white_concrete: 600, black_concrete: 300 }
            },
            {
                title: "🪟 Façade Vitrée Panoramique",
                desc: "Installez les grandes baies vitrées en light_blue_stained_glass. Les fenêtres couvrent presque toute la façade sud.",
                blocks: { light_blue_stained_glass: 200, glass_pane: 60 }
            },
            {
                title: "🏠 Intérieur - Rez-de-chaussée",
                desc: "Open space cuisine/salon avec sol en smooth_stone. Kitchenette en quartz_block, îlot central.",
                blocks: { smooth_stone: 200, quartz_block: 200, crafting_table: 3, furnace: 4 }
            },
            {
                title: "🛏️ Intérieur - Étage",
                desc: "Chambres et bureau à l'étage. Escalier moderne en quartz_block. Planchers en oak_planks/spruce_planks.",
                blocks: { oak_planks: 100, spruce_planks: 100, quartz_block: 100 }
            },
            {
                title: "🏊 Piscine Extérieure",
                desc: "Construisez la piscine en bordure de la maison avec prismarine et water_bucket. Terrasse en smooth_stone.",
                blocks: { prismarine: 50, dark_prismarine: 30, water_bucket: 30, smooth_stone: 100 }
            },
            {
                title: "🌿 Jardin sur le Toit",
                desc: "Aménagez un jardin sur le toit plat avec grass_block, saplings, flowers. Garde-corps en iron_block.",
                blocks: { grass_block: 40, oak_sapling: 6, flower: 20, iron_block: 100 }
            },
            {
                title: "🚗 Garage",
                desc: "Créez le garage avec porte automatique (pistons). Sol en gray_concrete. Espace de rangement.",
                blocks: { gray_concrete: 100, piston: 15, sticky_piston: 15, iron_door: 4 }
            },
            {
                title: "💡 Domotique et Éclairage",
                desc: "Installez le système domotique : éclairage automatique (redstone_lamp + observer), portes automatiques, alarme.",
                blocks: { redstone_lamp: 50, end_rod: 40, sea_lantern: 30, redstone: 150, observer: 10 }
            },
            {
                title: "🪑 Décoration et Meubles",
                desc: "Meublez avec style moderne : tapis blanc et bleu clair, éclairage d'ambiance, décoration minimale.",
                blocks: { white_carpet: 60, light_blue_carpet: 30, chest: 10, barrel: 10 }
            }
        ],
        tips: [
            "💡 Le style futuriste mise sur les formes géométriques simples et le blanc/noir",
            "💡 Les grandes baies vitrées sont essentielles pour ce style",
            "💡 La piscine avec prismarine donne un rendu incroyable",
            "💡 Le jardin sur le toit est tendance et fonctionnel",
            "💡 La domotique redstone rend la maison interactive",
            "💡 Utilisez les end_rod pour un éclairage moderne et épuré"
        ]
    },
    church: {
        name: "Église Médiévale",
        emoji: "⛪",
        width: 16, height: 22, depth: 28,
        description: "Église complète avec clocher, nef, chœur, vitraux et crypte",
        materials: {
            "stone_bricks": 2000,
            "cobblestone": 800,
            "mossy_stone_bricks": 200,
            "oak_planks": 400,
            "oak_log": 200,
            "white_stained_glass": 60,
            "blue_stained_glass": 40,
            "red_stained_glass": 30,
            "yellow_stained_glass": 20,
            "green_stained_glass": 20,
            "purple_stained_glass": 15,
            "oak_door": 2,
            "iron_bars": 40,
            "torch": 30,
            "lantern": 15,
            "candle": 30,
            "oak_fence": 100,
            "oak_stairs": 150,
            "oak_slab": 100,
            "quartz_block": 200,
            "smooth_stone": 150,
            "red_carpet": 60,
            "white_carpet": 20,
            "bell": 1,
            "lectern": 2,
            "bookshelf": 30,
            "chest": 8,
            "barrel": 6,
            "painting": 10,
            "banner": 12,
            "ladder": 40,
            "chain": 20,
            "flower_pot": 8,
            "spruce_planks": 100
        },
        steps: [
            {
                title: "⛪ Fondations et Nef",
                desc: "Tracez les fondations en forme de croix latine (16x28). La nef centrale fait 8 blocs de large, les bas-côtés 4 chacun.",
                blocks: { stone_bricks: 400 }
            },
            {
                title: "🧱 Murs de la Nef",
                desc: "Élevez les murs sur 10 blocs de haut. Colonnades intérieures avec des piliers en quartz_block. Arcades en stone_bricks.",
                blocks: { stone_bricks: 1200, quartz_block: 200 }
            },
            {
                title: "🪟 Vitraux",
                desc: "Créez les magnifiques vitraux avec du verre coloré (white, blue, red, yellow, green, purple). Motifs en rosace sur la façade ouest.",
                blocks: { white_stained_glass: 60, blue_stained_glass: 40, red_stained_glass: 30, yellow_stained_glass: 20, green_stained_glass: 20, purple_stained_glass: 15 }
            },
            {
                title: "🏛️ Chœur et Abside",
                desc: "Construisez le chœur avec une abside semi-circulaire. Sol en quartz_block, autel en smooth_stone et quartz_block.",
                blocks: { quartz_block: 100, smooth_stone: 150, stone_bricks: 400 }
            },
            {
                title: "🔔 Clocher",
                desc: "Élevez le clocher au-dessus de la façade principale. Tour carrée avec toit pointu en oak_stairs. Installez la bell.",
                blocks: { stone_bricks: 400, oak_stairs: 100, bell: 1, cobblestone: 200 }
            },
            {
                title: "🪵 Charpente et Toiture",
                desc: "Construisez la charpente apparente en oak_log et oak_planks. Toit en escaliers de chêne. Voûte en berceau.",
                blocks: { oak_log: 200, oak_planks: 200, oak_stairs: 50 }
            },
            {
                title: "🪑 Mobilier Liturgique",
                desc: "Installez les bancs (oak_fence + oak_slab), l'ambon (lectern), l'autel, les chandeliers (candle).",
                blocks: { oak_fence: 100, oak_slab: 100, lectern: 2, candle: 30 }
            },
            {
                title: "📚 Sacristie et Crypte",
                desc: "Aménagez la sacristie avec des bookshelf et chest. Creusez la crypte sous le chœur avec des stone_bricks.",
                blocks: { bookshelf: 30, chest: 8, cobblestone: 400, oak_planks: 100 }
            },
            {
                title: "🎨 Décoration et Art Sacré",
                desc: "Ajoutez des peintures, bannières, statues (armor_stand). Décorez les murs avec des motifs en pierre.",
                blocks: { painting: 10, banner: 12, armor_stand: 4, flower_pot: 8 }
            },
            {
                title: "🔦 Éclairage Ambiant",
                desc: "Éclairez avec des lanternes, torches et bougies. Lumière tamisée pour l'atmosphère sacrée. Vitraux illuminés.",
                blocks: { lantern: 15, torch: 30, candle: 30 }
            }
        ],
        tips: [
            "💡 Les vitraux colorés sont le détail le plus impressionnant de l'église",
            "💡 Les colonnades intérieures donnent de la majesté à la nef",
            "💡 La charpente apparente en bois ajoute beaucoup de caractère",
            "💡 Le clocher doit être le point le plus visible du bâtiment",
            "💡 L'éclairage tamisé avec bougies crée une atmosphère unique",
            "💡 La crypte sous l'église ajoute du mystère et de l'espace"
        ]
    }
};

// Fonction de génération de bâtiment personnalisé
function generateCustomBuild(name, style, size) {
    const sizeMap = {
        small: { w: 16, h: 16, d: 16 },
        medium: { w: 32, h: 32, d: 32 },
        large: { w: 48, h: 48, d: 48 },
        huge: { w: 64, h: 64, d: 64 }
    };
    
    const dims = sizeMap[size] || sizeMap.medium;
    
    const styleBlocks = {
        modern: ["white_concrete", "black_concrete", "glass_pane", "quartz_block", "smooth_stone", "gray_concrete", "light_blue_stained_glass"],
        medieval: ["stone_bricks", "cobblestone", "oak_planks", "oak_log", "oak_fence", "oak_stairs", "torch"],
        fantasy: ["purpur_block", "end_stone_bricks", "amethyst_block", "sea_lantern", "prismarine", "end_rod", "end_stone"],
        japanese: ["cherry_planks", "cherry_log", "cherry_stairs", "smooth_stone", "white_concrete", "red_concrete", "black_concrete"],
        steampunk: ["iron_block", "smooth_stone", "stone_bricks", "chain", "lantern", "copper_block", "exposed_copper"],
        nether: ["nether_bricks", "blackstone", "basalt", "netherrack", "magma_block", "crimson_planks", "red_nether_bricks"],
        end: ["end_stone", "end_stone_bricks", "purpur_block", "purpur_pillar", "end_rod", "chorus_plant", "end_stone_bricks"],
        realistic: ["stone_bricks", "oak_planks", "glass_pane", "smooth_stone", "cobblestone", "bricks", "oak_log"]
    };
    
    const blocks = styleBlocks[style] || styleBlocks.realistic;
    const materials = {};
    let totalBlocks = 0;
    
    // Génération aléatoire intelligente de matériaux
    blocks.forEach((block, i) => {
        const count = Math.floor(Math.random() * 500) + 50;
        materials[block] = count;
        totalBlocks += count;
    });
    
    return {
        name: name || "Structure Personnalisée",
        emoji: "🏗️",
        width: dims.w,
        height: dims.h,
        depth: dims.d,
        description: `Structure de style ${style} de taille ${size}`,
        materials: materials,
        totalBlocks: totalBlocks,
        steps: [
            {
                title: "🏗️ Fondations",
                desc: `Créez les fondations sur une zone de ${dims.w}x${dims.d} blocs. Délimitez les contours de la structure.`,
                blocks: { [blocks[0]]: Math.floor(dims.w * dims.d * 0.3) }
            },
            {
                title: "🧱 Murs et Structure",
                desc: "Élevez les murs extérieurs avec les blocs principaux du style choisi. Prévoyez les ouvertures pour portes et fenêtres.",
                blocks: { [blocks[1]]: Math.floor(totalBlocks * 0.3) }
            },
            {
                title: "🪟 Ouvertures et Fenêtres",
                desc: "Installez les fenêtres (verre) et les portes. Créez les arches et détails architecturaux.",
                blocks: { [blocks[2]]: Math.floor(totalBlocks * 0.1) }
            },
            {
                title: "🏠 Toiture",
                desc: "Construisez le toit selon le style : plat (moderne), en pente (médiéval), en dôme (fantasy), etc.",
                blocks: { [blocks[3]]: Math.floor(totalBlocks * 0.15) }
            },
            {
                title: "🪵 Aménagement Intérieur",
                desc: "Divisez l'espace intérieur en pièces. Ajoutez les planchers, escaliers et cloisons.",
                blocks: { [blocks[4]]: Math.floor(totalBlocks * 0.15) }
            },
            {
                title: "💡 Éclairage",
                desc: "Installez l'éclairage avec des lanternes, torches ou blocs lumineux selon le style.",
                blocks: { [blocks[5]]: Math.floor(totalBlocks * 0.05) }
            },
            {
                title: "🪑 Décoration Extérieure",
                desc: "Ajoutez les détails extérieurs : jardin, clôtures, sentiers, décoration murale.",
                blocks: { [blocks[6]]: Math.floor(totalBlocks * 0.1) }
            },
            {
                title: "🔨 Finitions",
                desc: "Finalisez avec les derniers détails : meubles, objets décoratifs, éclairage d'ambiance.",
                blocks: { [blocks[0]]: Math.floor(totalBlocks * 0.05) }
            }
        ],
        tips: [
            `💡 Style ${style} : utilisez les blocs caractéristiques de ce style`,
            "💡 Commencez toujours par les fondations et la structure porteuse",
            "💡 Pensez à l'éclairage intérieur ET extérieur",
            "💡 Les détails font la différence entre un bon et un excellent build",
            "💡 N'hésitez pas à modifier le design selon vos goûts !",
            "💡 Utilisez les dalles et escaliers pour créer des courbes"
        ]
    };
}

console.log("🏗️ Moteur de génération chargé avec succès !");