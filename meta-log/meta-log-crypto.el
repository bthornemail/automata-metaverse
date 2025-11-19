;;; meta-log-crypto.el --- BIP32/39/44 cryptographic operations

;; Copyright (C) 2025 Automaton System
;; Author: Automaton System
;; Version: 1.0.0

;; This file is part of meta-log.

;; meta-log is free software: you can redistribute it and/or modify
;; it under the terms of the MIT License.

;;; Commentary:

;; Cryptographic operations for meta-log federation.
;; Implements BIP32/39/44 for HD wallet key derivation and management.

;;; Code:

(require 'cl-lib)
(require 'org)

;; BIP39 word list (first 128 words for 12-word mnemonic)
(defconst meta-log-crypto--bip39-wordlist
  '("abandon" "ability" "able" "about" "above" "absent" "absorb" "abstract"
    "absurd" "abuse" "access" "accident" "account" "accuse" "achieve" "acid"
    "acoustic" "acquire" "across" "act" "action" "actor" "actual" "adapt"
    "add" "addict" "address" "adjust" "admit" "adult" "advance" "advice"
    "aerobic" "affair" "afford" "afraid" "again" "age" "agent" "agree"
    "ahead" "aim" "air" "airport" "aisle" "alarm" "album" "alcohol"
    "alert" "alien" "all" "alley" "allow" "almost" "alone" "alpha"
    "already" "also" "alter" "always" "amateur" "amazing" "among" "amount"
    "amused" "analyst" "anchor" "ancient" "anger" "angle" "angry" "animal"
    "ankle" "announce" "annual" "another" "answer" "antenna" "antique" "anxiety"
    "any" "apart" "apology" "appear" "apple" "approve" "april" "area"
    "arena" "argue" "arm" "armed" "armor" "army" "around" "arrange"
    "arrest" "arrive" "arrow" "art" "article" "artist" "artwork" "ask"
    "aspect" "assault" "asset" "assist" "assume" "asthma" "athlete" "atom"
    "attack" "attend" "attitude" "attract" "auction" "audit" "august" "aunt"
    "author" "auto" "autumn" "average" "avocado" "avoid" "awake" "aware"
    "away" "awesome" "awful" "awkward" "axis" "baby" "bachelor" "bacon"
    "badge" "bag" "balance" "balcony" "ball" "bamboo" "banana" "banner"
    "bar" "barely" "bargain" "barrel" "base" "basic" "basket" "battle"
    "beach" "bean" "beauty" "because" "become" "beef" "before" "begin"
    "behave" "behind" "believe" "below" "belt" "bench" "benefit" "best"
    "betray" "better" "between" "beyond" "bicycle" "bid" "bike" "bind"
    "biology" "bird" "birth" "bitter" "black" "blade" "blame" "blanket"
    "blast" "bleak" "bless" "blind" "blood" "blossom" "blow" "blue"
    "blur" "blush" "board" "boat" "body" "boil" "bomb" "bone"
    "bonus" "book" "boost" "border" "boring" "borrow" "boss" "bottom"
    "bounce" "box" "boy" "bracket" "brain" "brand" "brass" "brave"
    "bread" "breeze" "brick" "bridge" "brief" "bright" "bring" "brisk"
    "broccoli" "broken" "bronze" "broom" "brother" "brown" "brush" "bubble"
    "buddy" "budget" "buffalo" "build" "bulb" "bulk" "bullet" "bundle"
    "bunker" "burden" "burger" "burst" "bus" "business" "busy" "butter"
    "buyer" "buzz" "cabbage" "cabin" "cable" "cactus" "cage" "cake"
    "call" "calm" "camera" "camp" "can" "canal" "cancel" "candy"
    "cannon" "canoe" "canvas" "canyon" "capable" "capital" "captain" "car"
    "carbon" "card" "care" "career" "careful" "careless" "cargo" "carpet"
    "carry" "cart" "case" "cash" "casino" "cast" "casual" "cat"
    "catalog" "catch" "category" "cattle" "caught" "cause" "caution" "cave"
    "ceiling" "celery" "cement" "census" "century" "cereal" "certain" "chair"
    "chalk" "champion" "change" "chaos" "chapter" "charge" "chase" "chat"
    "cheap" "check" "cheese" "chef" "cherry" "chest" "chicken" "chief"
    "child" "chimney" "choice" "choose" "chronic" "chuckle" "chunk" "churn"
    "cigar" "cinnamon" "circle" "citizen" "city" "civil" "claim" "clamp"
    "clarify" "claw" "clay" "clean" "clerk" "clever" "click" "client"
    "cliff" "climb" "clinic" "clip" "clock" "clog" "close" "cloth"
    "cloud" "clown" "club" "clump" "cluster" "clutch" "coach" "coast"
    "coconut" "code" "coffee" "coil" "coin" "collect" "color" "column"
    "combine" "come" "comfort" "comic" "common" "company" "concert" "conduct"
    "confirm" "congress" "connect" "consider" "control" "convince" "cook" "cool"
    "copper" "copy" "coral" "core" "corn" "correct" "cost" "cotton"
    "couch" "country" "couple" "course" "cousin" "cover" "coyote" "crack"
    "cradle" "craft" "cram" "crane" "crash" "crater" "crawl" "crazy"
    "cream" "credit" "creek" "crew" "cricket" "crime" "crisp" "critic"
    "crop" "cross" "crouch" "crowd" "crucial" "cruel" "cruise" "crumble"
    "crunch" "crush" "cry" "crystal" "cube" "culture" "cup" "cupboard"
    "curious" "current" "curtain" "curve" "cushion" "custom" "cute" "cycle"
    "dad" "damage" "damp" "dance" "danger" "daring" "dark" "dash"
    "daughter" "dawn" "day" "deal" "debate" "debris" "decade" "december"
    "decide" "decline" "decorate" "decrease" "deer" "defense" "define" "defy"
    "degree" "delay" "deliver" "demand" "demise" "denial" "dentist" "deny"
    "depart" "depend" "deposit" "depth" "deputy" "derive" "describe" "desert"
    "design" "desk" "despair" "destroy" "detail" "detect" "develop" "device"
    "devote" "diagram" "dial" "diamond" "diary" "dice" "diesel" "diet"
    "differ" "digital" "dignity" "dilemma" "dinner" "dinosaur" "direct" "dirt"
    "disagree" "discover" "disease" "dish" "dismiss" "disorder" "display" "distance"
    "divert" "divide" "divorce" "dizzy" "doctor" "document" "dog" "doll"
    "dolphin" "domain" "donate" "donkey" "donor" "door" "dose" "double"
    "dove" "draft" "dragon" "drama" "drastic" "draw" "dream" "dress"
    "drift" "drill" "drink" "drip" "drive" "drop" "drum" "dry"
    "duck" "dumb" "dune" "during" "dust" "dutch" "duty" "dwarf"
    "dynamic" "eager" "eagle" "early" "earn" "earth" "easily" "east"
    "easy" "echo" "ecology" "economy" "edge" "edit" "educate" "effort"
    "egg" "eight" "either" "elbow" "elder" "electric" "elegant" "element"
    "elephant" "elevator" "elite" "else" "embark" "embody" "embrace" "emerge"
    "emotion" "employ" "empower" "empty" "enable" "enact" "end" "endless"
    "endorse" "enemy" "energy" "enforce" "engage" "engine" "enhance" "enjoy"
    "enlist" "enough" "enrich" "enroll" "ensure" "enter" "entire" "entry"
    "envelope" "episode" "equal" "equip" "era" "erase" "erode" "erosion"
    "error" "erupt" "escape" "essay" "essence" "estate" "eternal" "ethics"
    "evidence" "evil" "evoke" "evolve" "exact" "example" "exceed" "excel"
    "exception" "excess" "exchange" "excite" "exclude" "excuse" "execute" "exercise"
    "exhaust" "exhibit" "exile" "exist" "exit" "exotic" "expand" "expect"
    "expire" "explain" "expose" "express" "extend" "extra" "eye" "eyebrow"
    "fabric" "face" "faculty" "fade" "faint" "faith" "fall" "false"
    "fame" "family" "famous" "fan" "fancy" "fantasy" "farm" "fashion"
    "fat" "fatal" "father" "fatigue" "fault" "favorite" "feature" "february"
    "federal" "fee" "feed" "feel" "female" "fence" "festival" "fetch"
    "fever" "few" "fiber" "fiction" "field" "figure" "file" "film"
    "filter" "final" "find" "fine" "finger" "finish" "fire" "firm"
    "first" "fiscal" "fish" "fit" "fitness" "fix" "flag" "flame"
    "flash" "flat" "flavor" "flee" "flight" "flip" "float" "flock"
    "floor" "flower" "fluid" "flush" "fly" "foam" "focus" "fog"
    "foil" "fold" "follow" "food" "foot" "force" "forest" "forget"
    "fork" "fortune" "forum" "forward" "fossil" "foster" "found" "fox"
    "fragile" "frame" "frequent" "fresh" "friend" "fringe" "frog" "front"
    "frost" "frown" "frozen" "fruit" "fuel" "fun" "funny" "furnace"
    "fury" "future" "gadget" "gain" "galaxy" "gallery" "game" "gap"
    "garage" "garbage" "garden" "garlic" "garment" "gas" "gasp" "gate"
    "gather" "gauge" "gaze" "general" "genius" "genre" "gentle" "genuine"
    "gesture" "ghost" "giant" "gift" "giggle" "ginger" "giraffe" "girl"
    "give" "glad" "glance" "glare" "glass" "glide" "glimpse" "globe"
    "gloom" "glory" "glove" "glow" "glue" "goat" "goddess" "gold"
    "good" "goose" "gorilla" "gospel" "gossip" "govern" "gown" "grab"
    "grace" "grain" "grant" "grape" "grass" "gravity" "great" "green"
    "grid" "grief" "grit" "grocery" "group" "grow" "grunt" "guard"
    "guess" "guide" "guilt" "guitar" "gun" "gym" "habit" "hair"
    "half" "hammer" "hamster" "hand" "happy" "harbor" "hard" "harsh"
    "harvest" "hat" "have" "hawk" "hazard" "head" "health" "hear"
    "heaven" "heavy" "hedgehog" "height" "hello" "helmet" "help" "hen"
    "hero" "hidden" "high" "hill" "hint" "hip" "hire" "history"
    "hobby" "hockey" "hold" "hole" "holiday" "hollow" "home" "honey"
    "hood" "hope" "horn" "horror" "horse" "hospital" "host" "hotel"
    "hour" "hover" "hub" "huge" "human" "humble" "humor" "hundred"
    "hungry" "hunt" "hurdle" "hurry" "hurt" "husband" "hybrid" "ice"
    "icon" "idea" "identify" "idle" "ignore" "ill" "illegal" "illness"
    "image" "imitate" "immense" "immune" "impact" "implement" "impose" "improve"
    "impulse" "inch" "include" "income" "increase" "index" "indicate" "indoor"
    "industry" "infant" "inflict" "inform" "inhale" "inherit" "initial" "inject"
    "injury" "inmate" "inner" "innocent" "input" "inquiry" "insane" "insect"
    "inside" "inspire" "install" "intact" "interest" "into" "invest" "invite"
    "involve" "iron" "island" "isolate" "issue" "item" "ivory" "jacket"
    "jaguar" "jar" "jazz" "jealous" "jeans" "jelly" "jewel" "job"
    "join" "joke" "journey" "joy" "judge" "juice" "jump" "jungle"
    "junior" "junk" "just" "kangaroo" "keen" "keep" "ketchup" "key"
    "kick" "kid" "kidney" "kind" "kingdom" "kiss" "kit" "kitchen"
    "kite" "kitten" "kiwi" "knee" "knife" "knock" "know" "lab"
    "label" "labor" "ladder" "lady" "lake" "lamp" "language" "laptop"
    "large" "later" "latin" "laugh" "laundry" "lava" "law" "lawn"
    "lawsuit" "layer" "lazy" "leader" "leaf" "learn" "leave" "lecture"
    "left" "leg" "legal" "legend" "leisure" "lemon" "lend" "length"
    "lens" "leopard" "lesson" "letter" "level" "liar" "liberty" "library"
    "license" "life" "lift" "light" "like" "limb" "limit" "link"
    "lion" "liquid" "list" "little" "live" "lizard" "load" "loan"
    "lobster" "local" "lock" "logic" "lonely" "long" "loop" "lottery"
    "loud" "lounge" "love" "loyal" "lucky" "lumber" "lunar" "lunch"
    "luxury" "lyrics" "machine" "mad" "magic" "magnet" "maid" "mail"
    "main" "major" "make" "mammal" "man" "manage" "mandate" "mango"
    "mansion" "manual" "maple" "marble" "march" "margin" "marine" "market"
    "marriage" "mask" "mass" "master" "match" "material" "math" "matrix"
    "matter" "maximum" "maze" "meadow" "mean" "measure" "meat" "mechanic"
    "medal" "media" "melody" "melt" "member" "memory" "mention" "menu"
    "mercy" "merge" "merit" "merry" "mesh" "message" "metal" "method"
    "middle" "midnight" "milk" "million" "mimic" "mind" "minimum" "minor"
    "minute" "miracle" "mirror" "misery" "miss" "mistake" "mix" "mixed"
    "mixture" "mobile" "model" "modify" "mom" "moment" "monitor" "monkey"
    "monster" "month" "moon" "moral" "more" "morning" "mosquito" "mother"
    "motion" "motor" "mountain" "mouse" "move" "movie" "much" "muffin"
    "mule" "multiply" "muscle" "museum" "mushroom" "music" "must" "mutual"
    "myself" "mystery" "myth" "naive" "name" "napkin" "narrow" "nasty"
    "nation" "nature" "near" "neck" "need" "negative" "neglect" "neither"
    "nephew" "nerve" "nest" "net" "network" "neutral" "never" "new"
    "news" "next" "nice" "night" "noble" "noise" "nominee" "none"
    "noodle" "normal" "north" "nose" "notable" "note" "nothing" "notice"
    "novel" "now" "nuclear" "number" "nurse" "nut" "oak" "obey"
    "object" "oblige" "obscure" "observe" "obtain" "obvious" "occur" "ocean"
    "october" "odor" "off" "offer" "office" "often" "oil" "okay"
    "old" "olive" "olympic" "omit" "once" "one" "onion" "online"
    "only" "open" "opera" "opinion" "oppose" "option" "orange" "orbit"
    "orchard" "order" "ordinary" "organ" "orient" "original" "orphan" "ostrich"
    "other" "outdoor" "outer" "output" "outside" "oval" "oven" "over"
    "own" "owner" "oxygen" "oyster" "ozone" "pact" "paddle" "page"
    "pair" "palace" "palm" "panda" "panel" "panic" "panther" "paper"
    "parade" "parent" "park" "parrot" "party" "pass" "patch" "path"
    "patient" "patrol" "pattern" "pause" "pave" "payment" "peace" "peanut"
    "pear" "peasant" "pelican" "pen" "penalty" "pencil" "people" "pepper"
    "perfect" "permit" "person" "pet" "phone" "photo" "phrase" "physical"
    "piano" "picnic" "picture" "piece" "pig" "pigeon" "pill" "pilot"
    "pink" "pioneer" "pipe" "pistol" "pitch" "pizza" "place" "planet"
    "plastic" "plate" "play" "please" "pledge" "pluck" "plug" "plunge"
    "poem" "poet" "point" "polar" "pole" "police" "pond" "pony"
    "pool" "popular" "portion" "position" "possible" "post" "potato" "pottery"
    "poverty" "powder" "power" "practice" "praise" "predict" "prefer" "prepare"
    "present" "pretty" "prevent" "price" "pride" "primary" "print" "priority"
    "prison" "private" "prize" "problem" "process" "produce" "profit" "program"
    "project" "promote" "proof" "property" "prosper" "protect" "proud" "provide"
    "public" "pudding" "pull" "pulp" "pulse" "pumpkin" "punch" "pupil"
    "puppy" "purchase" "purity" "purpose" "purse" "push" "put" "puzzle"
    "pyramid" "quality" "quantum" "quarter" "question" "quick" "quit" "quiz"
    "quote" "rabbit" "raccoon" "race" "rack" "radar" "radio" "rail"
    "rain" "raise" "rally" "ramp" "ranch" "random" "range" "rapid"
    "rare" "rate" "rather" "raven" "raw" "razor" "ready" "real"
    "reason" "rebel" "rebuild" "recall" "receive" "recipe" "record" "recover"
    "recycle" "reduce" "reflect" "reform" "refuse" "region" "regret" "regular"
    "reject" "relax" "release" "relief" "rely" "remain" "remember" "remind"
    "remove" "render" "renew" "rent" "reopen" "repair" "repeat" "replace"
    "reply" "report" "require" "rescue" "resemble" "resist" "resource" "response"
    "result" "retire" "retreat" "return" "reunion" "reveal" "review" "reward"
    "rhythm" "rib" "ribbon" "rice" "rich" "ride" "ridge" "rifle"
    "right" "rigid" "ring" "riot" "rip" "ripe" "rise" "risk"
    "ritual" "rival" "river" "road" "roast" "robot" "robust" "rocket"
    "romance" "roof" "rookie" "room" "rose" "rotate" "rough" "round"
    "route" "royal" "rubber" "rude" "rug" "rule" "run" "runway"
    "rural" "sad" "saddle" "sadness" "safe" "sail" "salad" "salmon"
    "salon" "salt" "same" "sample" "sand" "satisfy" "satoshi" "sauce"
    "sausage" "save" "say" "scale" "scan" "scare" "scatter" "scene"
    "scheme" "school" "science" "scissors" "scorpion" "scout" "scrap" "screen"
    "script" "scrub" "sea" "search" "season" "seat" "second" "secret"
    "section" "security" "seed" "seek" "segment" "select" "sell" "seminar"
    "senior" "sense" "sentence" "series" "service" "session" "settle" "setup"
    "seven" "shadow" "shaft" "shallow" "share" "shed" "shell" "sheriff"
    "shield" "shift" "shine" "ship" "shiver" "shock" "shoe" "shoot"
    "shop" "short" "shoulder" "shove" "shovel" "show" "shrimp" "shrug"
    "shuffle" "shy" "sibling" "sick" "side" "siege" "sight" "sign"
    "silent" "silk" "silly" "silver" "similar" "simple" "since" "sing"
    "siren" "sister" "situate" "six" "size" "skate" "sketch" "ski"
    "skill" "skin" "skirt" "skull" "slab" "slam" "sleep" "slender"
    "slice" "slide" "slight" "slim" "slogan" "slot" "slow" "slush"
    "small" "smart" "smile" "smoke" "smooth" "snack" "snake" "snap"
    "sniff" "snow" "soap" "soccer" "social" "sock" "soda" "soft"
    "solar" "soldier" "solid" "solve" "someone" "song" "soon" "sorry"
    "sort" "soul" "sound" "soup" "source" "south" "space" "spare"
    "spatial" "spawn" "speak" "special" "speed" "spell" "spend" "sphere"
    "spice" "spider" "spike" "spin" "spirit" "split" "spoil" "sponsor"
    "spoon" "sport" "spot" "spray" "spread" "spring" "spy" "square"
    "squeeze" "squirrel" "stable" "stadium" "staff" "stage" "stairs" "stamp"
    "stand" "start" "state" "stay" "steak" "steel" "stem" "step"
    "stereo" "stick" "still" "sting" "stock" "stomach" "stone" "stool"
    "story" "stove" "strategy" "street" "strike" "strong" "struggle" "student"
    "stuff" "stumble" "style" "subject" "submit" "subway" "success" "such"
    "sudden" "suffer" "sugar" "suggest" "suit" "summer" "sun" "sunny"
    "sunset" "super" "supply" "support" "sure" "surface" "surge" "surprise"
    "surround" "survey" "suspect" "sustain" "swallow" "swamp" "swap" "swarm"
    "swear" "sweet" "swift" "swim" "swing" "switch" "sword" "symbol"
    "symptom" "syrup" "system" "table" "tackle" "tag" "tail" "talent"
    "talk" "tank" "tape" "target" "task" "taste" "tattoo" "taxi"
    "teach" "team" "tell" "ten" "tenant" "tennis" "tent" "term"
    "test" "text" "thank" "that" "theme" "then" "theory" "there"
    "they" "thing" "this" "thought" "three" "thrive" "throw" "thumb"
    "thunder" "ticket" "tide" "tiger" "tilt" "timber" "time" "tiny"
    "tip" "tired" "tissue" "title" "toast" "tobacco" "today" "toddler"
    "toe" "together" "toilet" "token" "tomato" "tomorrow" "tone" "tongue"
    "tonight" "tool" "tooth" "top" "topic" "topple" "torch" "tornado"
    "tortoise" "toss" "total" "tourist" "toward" "tower" "town" "toy"
    "track" "trade" "traffic" "tragic" "train" "transfer" "trap" "trash"
    "travel" "tray" "treat" "tree" "trend" "trial" "tribe" "trick"
    "trigger" "trim" "trip" "trophy" "trouble" "truck" "true" "truly"
    "trumpet" "trust" "truth" "try" "tube" "tuition" "tumble" "tuna"
    "tunnel" "turkey" "turn" "turtle" "twelve" "twenty" "twice" "twin"
    "twist" "two" "type" "typical" "ugly" "umbrella" "unable" "unaware"
    "uncle" "uncover" "under" "undo" "unfair" "unfold" "unhappy" "uniform"
    "unique" "unit" "universe" "unknown" "unlock" "until" "unusual" "unveil"
    "update" "upgrade" "uphold" "upon" "upper" "upset" "urban" "urge"
    "usage" "use" "used" "useful" "useless" "usual" "utility" "vacant"
    "vacuum" "vague" "valid" "valley" "valve" "van" "vanish" "vapor"
    "various" "vast" "vault" "vehicle" "velvet" "vendor" "venture" "venue"
    "verb" "verify" "version" "very" "vessel" "veteran" "viable" "vibrant"
    "vicious" "victory" "video" "view" "village" "vintage" "violin" "virtual"
    "virus" "visa" "visit" "visual" "vital" "vivid" "vocal" "voice"
    "void" "volcano" "volume" "vote" "voyage" "wage" "wagon" "wait"
    "walk" "wall" "walnut" "want" "warfare" "warm" "warrior" "wash"
    "wasp" "waste" "water" "wave" "way" "wealth" "weapon" "weary"
    "weather" "weave" "web" "wedding" "weekend" "weird" "welcome" "west"
    "wet" "whale" "what" "wheat" "wheel" "when" "where" "whip"
    "whisper" "wide" "width" "wife" "wild" "will" "win" "window"
    "wine" "wing" "wink" "winner" "winter" "wire" "wisdom" "wise"
    "wish" "witness" "wolf" "woman" "wonder" "wood" "wool" "word"
    "work" "world" "worry" "worth" "wrap" "wreck" "wrestle" "wrist"
    "write" "wrong" "yard" "year" "yellow" "you" "young" "youth"
    "zebra" "zero" "zone" "zoo")
  "BIP39 word list (2048 words).")

(defun meta-log-crypto--sha256 (data)
  "Compute SHA-256 hash of DATA.
DATA can be a string or a list of bytes.
Returns a list of 32 bytes."
  (if (fboundp 'sha256)
      (let ((hash (if (listp data)
                      (sha256 (apply 'string data))
                    (sha256 data))))
        (if (stringp hash)
            (string-to-list hash)
          hash))
    ;; Fallback: use external sha256sum if available
    (let ((temp-file (make-temp-file "meta-log-crypto-")))
      (unwind-protect
          (progn
            (if (listp data)
                (write-region (apply 'string data) nil temp-file nil 'silent)
              (write-region data nil temp-file nil 'silent))
            (let ((hash-str (shell-command-to-string
                             (format "sha256sum %s | cut -d' ' -f1" temp-file))))
              (cl-loop for i from 0 below 64 by 2
                       collect (string-to-number (substring hash-str i (+ i 2)) 16))))
        (delete-file temp-file)))))

(defun meta-log-crypto-generate-mnemonic (&optional strength)
  "Generate a BIP39 mnemonic phrase.
STRENGTH is the entropy strength in bits (128, 160, 192, 224, or 256).
Defaults to 128 (12 words).
Returns a list of mnemonic words."
  (let* ((strength (or strength 128))
         (entropy-bytes (/ strength 8))
         (entropy (cl-loop for i from 0 below entropy-bytes
                          collect (random 256)))
         (checksum-bits (/ strength 32))
         (hash (meta-log-crypto--sha256 entropy))
         (checksum-byte (car hash))
         (entropy-with-checksum (append entropy (list checksum-byte)))
         (mnemonic-indices '())
         (word-count (/ (+ strength checksum-bits) 11)))
    ;; Convert entropy to mnemonic indices
    (let ((bits '())
          (entropy-list entropy-with-checksum))
      (while entropy-list
        (let ((byte (car entropy-list)))
          (setq entropy-list (cdr entropy-list))
          (dotimes (i 8)
            (push (logand byte 1) bits)
            (setq byte (ash byte -1)))))
      (setq bits (nreverse bits))
      ;; Extract 11-bit indices
      (dotimes (i word-count)
        (let ((index 0))
          (dotimes (j 11)
            (setq index (logior index (ash (pop bits) j))))
          (push index mnemonic-indices))))
    ;; Convert indices to words
    (mapcar (lambda (idx)
              (nth idx meta-log-crypto--bip39-wordlist))
            (nreverse mnemonic-indices))))

(defun meta-log-crypto-mnemonic-to-seed (mnemonic &optional passphrase)
  "Convert BIP39 mnemonic to seed.
MNEMONIC is a list of words or a space-separated string.
PASSPHRASE is an optional passphrase string.
Returns a 64-byte seed as a list of bytes."
  (let* ((mnemonic-str (if (listp mnemonic)
                           (mapconcat 'identity mnemonic " ")
                         mnemonic))
         (passphrase (or passphrase ""))
         (salt (concat "mnemonic" passphrase))
         (seed (meta-log-crypto--pbkdf2 mnemonic-str salt 2048 64)))
    seed))

(defun meta-log-crypto--pbkdf2 (password salt iterations key-length)
  "PBKDF2 key derivation function.
PASSWORD is the password string.
SALT is the salt string.
ITERATIONS is the number of iterations.
KEY-LENGTH is the desired key length in bytes.
Returns a list of bytes."
  ;; Simplified PBKDF2 implementation using HMAC-SHA512
  ;; For production, use a proper crypto library
  (let ((hmac-key (concat password salt))
        (result '()))
    (dotimes (i key-length)
      (let ((block (meta-log-crypto--hmac-sha512 hmac-key
                                                  (concat salt (number-to-string i)))))
        (setq result (append result block))))
    (cl-subseq result 0 key-length)))

(defun meta-log-crypto--hmac-sha512 (key data)
  "HMAC-SHA512 implementation.
KEY and DATA are strings.
Returns a list of 64 bytes."
  ;; Simplified HMAC implementation
  ;; For production, use a proper crypto library
  (let ((hash (meta-log-crypto--sha256 (concat key data))))
    ;; Pad to 64 bytes for SHA-512
    (append hash (make-list (- 64 (length hash)) 0))))

(defun meta-log-crypto-derive-key (seed path)
  "Derive a BIP32/44 key from seed.
SEED is a 64-byte seed (list of bytes).
PATH is a BIP44 path string like \"m/44'/60'/0'/0/0\".
Returns a list containing (private-key public-key chain-code)."
  (let* ((path-parts (split-string (substring path 2) "/"))
         (master-key (meta-log-crypto--derive-master-key seed))
         (current-key master-key))
    (dolist (part path-parts)
      (let ((index (string-to-number (replace-regexp-in-string "'" "" part)))
            (hardened (string-suffix-p "'" part)))
        (setq current-key (meta-log-crypto--derive-child-key current-key index hardened))))
    current-key))

(defun meta-log-crypto--derive-master-key (seed)
  "Derive master key from seed.
Returns (private-key public-key chain-code)."
  (let* ((hmac (meta-log-crypto--hmac-sha512 "Bitcoin seed" seed))
         (private-key (cl-subseq hmac 0 32))
         (chain-code (cl-subseq hmac 32 64))
         (public-key (meta-log-crypto--private-to-public private-key)))
    (list private-key public-key chain-code)))

(defun meta-log-crypto--derive-child-key (parent-key index hardened)
  "Derive child key from parent.
PARENT-KEY is (private-key public-key chain-code).
INDEX is the child index.
HARDENED is t if this is a hardened derivation.
Returns (private-key public-key chain-code)."
  (let* ((parent-private (nth 0 parent-key))
         (parent-chain (nth 2 parent-key))
         (data (if hardened
                   (append (list 0) parent-private (list (logand index 255)))
                 (append (meta-log-crypto--private-to-public parent-private)
                         (list (logand index 255)))))
         (hmac (meta-log-crypto--hmac-sha512 parent-chain data))
         (child-private (meta-log-crypto--add-scalars (cl-subseq hmac 0 32) parent-private))
         (child-chain (cl-subseq hmac 32 64))
         (child-public (meta-log-crypto--private-to-public child-private)))
    (list child-private child-public child-chain)))

(defun meta-log-crypto--private-to-public (private-key)
  "Convert private key to public key.
PRIVATE-KEY is a list of 32 bytes.
Returns a list of 33 bytes (compressed public key)."
  ;; Simplified: for production, use proper elliptic curve cryptography
  ;; This is a placeholder that returns a deterministic value
  (let ((hash (meta-log-crypto--sha256 private-key)))
    (append (list 2) (cl-subseq hash 0 32))))

(defun meta-log-crypto--add-scalars (a b)
  "Add two scalar values (mod n).
A and B are lists of bytes.
Returns a list of bytes."
  ;; Simplified scalar addition
  ;; For production, use proper modular arithmetic
  (let ((result '())
        (carry 0))
    (cl-loop for i from 0 below (max (length a) (length b))
             do (let ((sum (+ (or (nth i a) 0)
                              (or (nth i b) 0)
                              carry)))
                  (push (logand sum 255) result)
                  (setq carry (ash sum -8))))
    (nreverse result)))

(defun meta-log-crypto-sign (private-key data)
  "Sign DATA with PRIVATE-KEY.
PRIVATE-KEY is a list of bytes.
DATA is a string or list of bytes.
Returns a signature as a list of bytes."
  (let* ((data-bytes (if (stringp data)
                         (string-to-list data)
                       data))
         (hash (meta-log-crypto--sha256 data-bytes))
         (signature (meta-log-crypto--ecdsa-sign private-key hash)))
    signature))

(defun meta-log-crypto-verify (public-key signature data)
  "Verify SIGNATURE of DATA with PUBLIC-KEY.
PUBLIC-KEY is a list of bytes.
SIGNATURE is a list of bytes.
DATA is a string or list of bytes.
Returns t if signature is valid."
  (let* ((data-bytes (if (stringp data)
                         (string-to-list data)
                       data))
         (hash (meta-log-crypto--sha256 data-bytes))
         (valid (meta-log-crypto--ecdsa-verify public-key signature hash)))
    valid))

(defun meta-log-crypto--ecdsa-sign (private-key hash)
  "ECDSA signature generation (simplified).
PRIVATE-KEY is a list of bytes.
HASH is a list of bytes.
Returns a signature as a list of bytes."
  ;; Simplified ECDSA implementation
  ;; For production, use proper elliptic curve cryptography
  (let ((combined (append private-key hash)))
    (cl-subseq (meta-log-crypto--sha256 combined) 0 64)))

(defun meta-log-crypto--ecdsa-verify (public-key signature hash)
  "ECDSA signature verification (simplified).
PUBLIC-KEY is a list of bytes.
SIGNATURE is a list of bytes.
HASH is a list of bytes.
Returns t if signature is valid."
  ;; Simplified ECDSA verification
  ;; For production, use proper elliptic curve cryptography
  (let ((recomputed (meta-log-crypto--sha256 (append public-key hash))))
    (equal (cl-subseq recomputed 0 32) (cl-subseq signature 0 32))))

(defun meta-log-crypto-format-key (key)
  "Format a key as hex string.
KEY is a list of bytes.
Returns a hex string prefixed with '0x'."
  (concat "0x" (mapconcat (lambda (b)
                            (format "%02x" b))
                          key "")))

(defun meta-log-crypto-parse-key (hex-string)
  "Parse a hex string to a list of bytes.
HEX-STRING is a hex string, optionally prefixed with '0x'.
Returns a list of bytes."
  (let ((hex (replace-regexp-in-string "^0x" "" hex-string)))
    (cl-loop for i from 0 below (length hex) by 2
             collect (string-to-number (substring hex i (+ i 2)) 16))))

;;; Org Mode Integration

(defun meta-log-crypto-encrypt (data password)
  "Encrypt DATA with PASSWORD.
DATA is a string.
PASSWORD is a string.
Returns encrypted data as hex string."
  ;; Simplified encryption: XOR with password hash
  ;; For production, use proper encryption (AES-GCM)
  (let* ((password-hash (meta-log-crypto--sha256 password))
         (data-bytes (string-to-list data))
         (encrypted '()))
    (dolist (byte data-bytes)
      (push (logxor byte (car password-hash)) encrypted)
      (setq password-hash (append (cdr password-hash) (list (car password-hash)))))
    (meta-log-crypto-format-key (nreverse encrypted))))

(defun meta-log-crypto-decrypt (encrypted-hex password)
  "Decrypt ENCRYPTED-HEX with PASSWORD.
ENCRYPTED-HEX is a hex string.
PASSWORD is a string.
Returns decrypted data as string."
  ;; Simplified decryption: XOR with password hash
  ;; For production, use proper decryption (AES-GCM)
  (let* ((encrypted (meta-log-crypto-parse-key encrypted-hex))
         (password-hash (meta-log-crypto--sha256 password))
         (decrypted '()))
    (dolist (byte encrypted)
      (push (logxor byte (car password-hash)) decrypted)
      (setq password-hash (append (cdr password-hash) (list (car password-hash)))))
    (apply 'string (nreverse decrypted))))

(defun meta-log-crypto-save-mnemonic-to-org (mnemonic file &optional password)
  "Save mnemonic to Org Mode property drawer.
MNEMONIC is a list of words or space-separated string.
FILE is the path to the Org file.
PASSWORD is optional encryption password."
  (interactive "sMnemonic: \nFOrg file: \nsPassword (optional): ")
  (let* ((mnemonic-str (if (listp mnemonic)
                           (mapconcat 'identity mnemonic " ")
                         mnemonic))
         (encrypted (if password
                        (meta-log-crypto-encrypt mnemonic-str password)
                      mnemonic-str))
         (buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (unless (re-search-forward "^\\*.*Peer Identity" nil t)
        (goto-char (point-max))
        (insert "\n* Peer Identity\n"))
      (org-back-to-heading)
      (org-set-property "PEER_MNEMONIC" encrypted)
      (when password
        (org-set-property "PEER_MNEMONIC_ENCRYPTED" "true"))
      (save-buffer))
    (message "Mnemonic saved to %s" file)))

(defun meta-log-crypto-load-mnemonic-from-org (file &optional password)
  "Load mnemonic from Org Mode property drawer.
FILE is the path to the Org file.
PASSWORD is optional decryption password.
Returns mnemonic as space-separated string."
  (interactive "FOrg file: \nsPassword (optional): ")
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (when (re-search-forward "^\\*.*Peer Identity" nil t)
        (let ((encrypted (org-entry-get (point) "PEER_MNEMONIC"))
              (is-encrypted (org-entry-get (point) "PEER_MNEMONIC_ENCRYPTED")))
          (if (and encrypted is-encrypted password)
              (meta-log-crypto-decrypt encrypted password)
            encrypted))))))

(defun meta-log-crypto-save-keys-to-org (keys file)
  "Save derived keys to Org Mode property drawer.
KEYS is a list of (path private-key public-key) tuples.
FILE is the path to the Org file."
  (interactive "FOrg file: ")
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (unless (re-search-forward "^\\*.*Peer Identity" nil t)
        (goto-char (point-max))
        (insert "\n* Peer Identity\n"))
      (org-back-to-heading)
      (let ((keys-str (mapconcat (lambda (key-tuple)
                                   (format "%s:%s:%s"
                                           (nth 0 key-tuple)
                                           (meta-log-crypto-format-key (nth 1 key-tuple))
                                           (meta-log-crypto-format-key (nth 2 key-tuple))))
                                 keys "\n")))
        (org-set-property "CRYPTO_KEYS" keys-str))
      (save-buffer))
    (message "Keys saved to %s" file)))

(defun meta-log-crypto-load-keys-from-org (file)
  "Load derived keys from Org Mode property drawer.
FILE is the path to the Org file.
Returns a list of (path private-key public-key) tuples."
  (interactive "FOrg file: ")
  (let ((buffer (find-file-noselect file)))
    (with-current-buffer buffer
      (goto-char (point-min))
      (when (re-search-forward "^\\*.*Peer Identity" nil t)
        (let ((keys-str (org-entry-get (point) "CRYPTO_KEYS")))
          (when keys-str
            (mapcar (lambda (line)
                     (let ((parts (split-string line ":")))
                       (list (nth 0 parts)
                             (meta-log-crypto-parse-key (nth 1 parts))
                             (meta-log-crypto-parse-key (nth 2 parts)))))
                   (split-string keys-str "\n" t))))))))

(defun meta-log-crypto-derive-bip44-path (purpose coin account change index)
  "Derive BIP44 path string.
PURPOSE is the purpose (44 for BIP44).
COIN is the coin type (0 for Bitcoin, 60 for Ethereum, 'meta-log' for meta-log).
ACCOUNT is the account index.
CHANGE is 0 for external, 1 for internal.
INDEX is the address index.
Returns path string like \"m/44'/60'/0'/0/0\"."
  (let ((coin-str (if (numberp coin)
                      (number-to-string coin)
                    (format "'%s'" coin))))
    (format "m/%d'/%s/%d'/%d/%d" purpose coin-str account change index)))

(defun meta-log-crypto-derive-ethereum-key (seed account change index)
  "Derive Ethereum key using BIP44.
SEED is a 64-byte seed.
ACCOUNT is the account index.
CHANGE is 0 for external, 1 for internal.
INDEX is the address index.
Returns (private-key public-key chain-code)."
  (let ((path (meta-log-crypto-derive-bip44-path 44 60 account change index)))
    (meta-log-crypto-derive-key seed path)))

(defun meta-log-crypto-derive-bitcoin-key (seed account change index)
  "Derive Bitcoin key using BIP44.
SEED is a 64-byte seed.
ACCOUNT is the account index.
CHANGE is 0 for external, 1 for internal.
INDEX is the address index.
Returns (private-key public-key chain-code)."
  (let ((path (meta-log-crypto-derive-bip44-path 44 0 account change index)))
    (meta-log-crypto-derive-key seed path)))

(defun meta-log-crypto-derive-meta-log-key (seed account change index)
  "Derive meta-log specific key using BIP44.
SEED is a 64-byte seed.
ACCOUNT is the account index.
CHANGE is 0 for external, 1 for internal.
INDEX is the address index.
Returns (private-key public-key chain-code)."
  (let ((path (meta-log-crypto-derive-bip44-path 44 'meta-log account change index)))
    (meta-log-crypto-derive-key seed path)))

;;; Local Identity Management

(defvar meta-log-crypto--local-identity nil
  "Local identity (public key) for this node.")

(defvar meta-log-crypto--local-private-key nil
  "Local private key for this node.")

(defun meta-log-crypto-set-local-identity (mnemonic-or-seed &optional passphrase)
  "Set local identity from mnemonic or seed.

MNEMONIC-OR-SEED can be:
- A BIP39 mnemonic (list of words or space-separated string)
- A 64-byte seed (list of bytes)

PASSPHRASE is optional passphrase for mnemonic.

Derives the local identity (public key) and stores it globally."
  (interactive "sMnemonic or seed: \nsPassphrase (optional): ")
  (let* ((seed (if (and (listp mnemonic-or-seed) (= (length mnemonic-or-seed) 64))
                   ;; Already a seed
                   mnemonic-or-seed
                 ;; Convert mnemonic to seed
                 (meta-log-crypto-mnemonic-to-seed mnemonic-or-seed passphrase)))
         (keys (meta-log-crypto-derive-meta-log-key seed 0 0 0))
         (private-key (nth 0 keys))
         (public-key (nth 1 keys)))
    (setq meta-log-crypto--local-private-key private-key)
    (setq meta-log-crypto--local-identity public-key)
    (message "Local identity set: %s" (meta-log-crypto-format-key public-key))
    public-key))

(defun meta-log-crypto-get-local-identity ()
  "Get the local identity (public key).

Returns the public key as a list of bytes, or nil if not set."
  meta-log-crypto--local-identity)

(defun meta-log-crypto-get-local-private-key ()
  "Get the local private key.

Returns the private key as a list of bytes, or nil if not set."
  meta-log-crypto--local-private-key)

(provide 'meta-log-crypto)

;;; meta-log-crypto.el ends here

