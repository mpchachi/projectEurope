#!/usr/bin/env python3
"""
scripts/generate_demo_student.py

Generates 8 synthetic Deepgram-format JSON files for the "demo-exotic" student.
Shows gradual A2→B1 progression across exotic conversation topics.
Registers the preset in api.py automatically.

Usage (from project root):
    python scripts/generate_demo_student.py
"""

import json
import uuid
import random
import re
from pathlib import Path

random.seed(42)

OUT_DIR = Path("demo_student")
OUT_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# Conversations
# Each session = list of (speaker, text, sentiment, score)
#   speaker: "S" = student (diarization speaker 0)
#            "T" = tutor  (diarization speaker 1)
# ─────────────────────────────────────────────────────────────────────────────

SESSIONS_DATA = [

    # ── Session 1: Urban Beekeeping (A2) ──────────────────────────────────────
    {
        "label": "Urban Beekeeping",
        "topic_main": "Urban Beekeeping",
        "created": "2026-02-01T10:00:00.000Z",
        "convo": [
            ("T", "So today I want to talk about something quite unusual. Have you heard about keeping bees in the city?", "neutral", -0.05),
            ("S", "Uh... bees? In the city? No, I... I not know this is possible.", "neutral", -0.12),
            ("T", "Yes! It's called urban beekeeping. People keep beehives on rooftops in big cities like London or New York. What do you think about that idea?", "positive", 0.45),
            ("S", "Um... I think it is... uh... interesting? But is dangerous, no? Bees can... uh... they can attack people.", "neutral", -0.08),
            ("T", "That's a good point. What word do you use when bees attack?", "neutral", 0.1),
            ("S", "Uh... attack? Or... sting? They sting you.", "positive", 0.15),
            ("T", "Exactly! They sting. And yes, it can happen, but trained beekeepers know how to handle them safely. Do you know what bees produce?", "positive", 0.4),
            ("S", "Yes, honey! I know this word. And also... um... wax? Bee wax?", "positive", 0.3),
            ("T", "Beeswax, yes! Very good. And why is honey important, do you think?", "positive", 0.35),
            ("S", "Uh... for eating? And also... um... I think for... for medicine? My grandmother use honey for... for cough.", "positive", 0.25),
            ("T", "Wonderful example! Your grandmother is wise. Honey has antibacterial properties. That's a complex word — it means it kills bacteria. Can you repeat: antibacterial?", "positive", 0.5),
            ("S", "Anti... antibacterial. Yes, I understand. So honey is like... like natural medicine.", "neutral", 0.1),
            ("T", "Exactly. Now, what do you think is the biggest problem with keeping bees in a city?", "neutral", -0.05),
            ("S", "Um... maybe the... uh... the neighbors? They can... they can be afraid? And also maybe there is no flowers for bees in the city.", "neutral", -0.1),
            ("T", "Both excellent points! The neighbors and the flowers — we call it 'foraging space' for the bees. You're thinking very logically.", "positive", 0.6),
            ("S", "Foraging. New word for me. Is like... searching for food?", "positive", 0.2),
            ("T", "Precisely! To forage means to search for and collect food. Great question.", "positive", 0.55),
            ("S", "I think... uh... in my country we have beekeeping but in... in the countryside, not city.", "neutral", -0.05),
        ],
        "topics_list": ["Urban Beekeeping", "Food Production", "City Ecology"],
        "intents_list": ["Ask about topic", "Share personal experience", "Learn vocabulary", "Express opinion"],
        "summary": "The student discussed urban beekeeping, learning vocabulary like 'sting', 'beeswax', 'antibacterial', and 'foraging'. The student shared a personal anecdote about grandmother using honey for medicine, demonstrating real-world connection.",
    },

    # ── Session 2: Deep Sea Creatures (A2) ────────────────────────────────────
    {
        "label": "Deep Sea Creatures",
        "topic_main": "Deep Sea Biology",
        "created": "2026-02-08T10:00:00.000Z",
        "convo": [
            ("T", "Today we're going to explore something mysterious — the deep ocean. What do you know about life at the bottom of the sea?", "neutral", -0.02),
            ("S", "Um... I think there is... uh... fish? And maybe... uh... strange animals. Like... uh... very big. I see in documentaries.", "neutral", -0.1),
            ("T", "Good! Yes, there are extraordinary creatures there. Have you heard of bioluminescence? It's when animals make their own light.", "positive", 0.4),
            ("S", "Biolum... uh... no, I not know this word. Animals make light? Like... like a lamp?", "positive", 0.2),
            ("T", "Exactly like a lamp, but it comes from inside their bodies through a chemical reaction. The anglerfish is a famous example.", "positive", 0.35),
            ("S", "Anglerfish! Yes, I see this in movie — Finding Nemo! It is very... uh... scary fish. It have light on the head.", "positive", 0.3),
            ("T", "That's right! The light attracts prey in the darkness. Can you guess what 'prey' means?", "neutral", 0.05),
            ("S", "Prey is... uh... the animal that is eaten? Like... food for other animal?", "neutral", -0.05),
            ("T", "Perfect definition! Very well reasoned. And the animal that eats is called the 'predator'. Can you give me an example of a predator?", "positive", 0.5),
            ("S", "Uh... shark is predator. And... and lion on land. They hunt other animals.", "neutral", 0.1),
            ("T", "Excellent. Now, why do you think animals need light in the deep ocean?", "neutral", -0.05),
            ("S", "Because... uh... because there is no sun? In very deep water the sun... the sun cannot reach. So is very dark.", "neutral", -0.08),
            ("T", "Brilliant reasoning! Below about 200 meters there's no sunlight at all. We call this the midnight zone.", "positive", 0.45),
            ("S", "Midnight zone... I like this name. Is like... living in the night, always.", "positive", 0.35),
            ("T", "Beautiful way to put it. How do you think these creatures survive under such extreme pressure?", "neutral", -0.02),
            ("S", "Pressure? Like... uh... the water push? I think their body is... uh... is different from normal fish. They are... adapted?", "neutral", -0.05),
            ("T", "Exactly the right word — adapted! Their bodies have evolved special features to handle the pressure. You're using great scientific language.", "positive", 0.6),
            ("S", "Um... in school I study about evolution. I know this concept but in English is... is difficult to explain.", "neutral", -0.1),
        ],
        "topics_list": ["Deep Sea Biology", "Bioluminescence", "Animal Adaptation"],
        "intents_list": ["Ask for clarification", "Make connection to prior knowledge", "Guess meaning from context", "Express difficulty"],
        "summary": "The student explored deep sea biology, connecting the anglerfish to Finding Nemo and reasoning through vocabulary like 'prey', 'predator', 'adapted', and 'midnight zone'. Good use of context clues to guess word meanings.",
    },

    # ── Session 3: Fermentation Science (A2+) ─────────────────────────────────
    {
        "label": "Fermentation Science",
        "topic_main": "Fermentation & Microbiology",
        "created": "2026-02-15T10:00:00.000Z",
        "convo": [
            ("T", "This week I want to talk about something that's been happening in your kitchen your whole life without you knowing. Fermentation! Do you eat any fermented foods?", "positive", 0.3),
            ("S", "Fermented... um... I think yogurt? And bread, maybe? Also my mother makes... uh... something with cabbage. Like... sour cabbage.", "neutral", 0.05),
            ("T", "Your mother makes sauerkraut or kimchi perhaps? That's fermented cabbage! You already have great examples.", "positive", 0.55),
            ("S", "Yes! We call it in our language but I don't know the English word. It is very sour and we eat with meat.", "neutral", 0.0),
            ("T", "That's exactly fermentation at work. Tiny microorganisms — bacteria — eat the sugars in the cabbage and produce lactic acid. That's what makes it sour.", "neutral", 0.0),
            ("S", "So bacteria are... are good sometimes? I always think bacteria is bad — like when you are sick.", "neutral", -0.1),
            ("T", "Exactly the misconception most people have! Some bacteria cause disease, but many are essential and beneficial. What word did I just use?", "neutral", 0.05),
            ("S", "Beneficial. It means... uh... good? Like, it helps you?", "positive", 0.2),
            ("T", "Perfect! Beneficial means helpful or advantageous. Now why do you think humans started fermenting food thousands of years ago?", "positive", 0.35),
            ("S", "Hmm... maybe because they not have refrigerator? So fermentation was like... uh... a way to preserve the food for longer time.", "neutral", -0.05),
            ("T", "Outstanding deduction! Preservation was exactly one of the main reasons. You used 'preserve' correctly too — excellent.", "positive", 0.7),
            ("S", "I read something about this. I think there is also... uh... the alcohol? Like wine and beer are also from fermentation.", "neutral", 0.05),
            ("T", "Spot on! Yeast — a different microorganism — ferments grape juice into wine and grain into beer. How do you feel about that discovery?", "positive", 0.4),
            ("S", "It is amazing for me because I drink beer sometimes and I never think about the science inside. Now I see that... that biology is everywhere.", "positive", 0.5),
            ("T", "I love that observation — biology is everywhere! Can you tell me about a fermented food that is special in your country?", "positive", 0.55),
            ("S", "Yes! We have a drink called kefir — it is made from milk and is very popular. The texture is... uh... like liquid yogurt. Very healthy, I think, for the stomach.", "positive", 0.4),
            ("T", "Kefir is an excellent example! It contains probiotics — live bacteria that support gut health. So your culture has been using fermentation science for centuries.", "positive", 0.6),
            ("S", "Yes, and now it is very trendy in Western countries. It is funny because for us it is just... it is just normal food.", "positive", 0.35),
        ],
        "topics_list": ["Fermentation", "Microbiology", "Food Preservation", "Cultural Traditions"],
        "intents_list": ["Share cultural knowledge", "Make scientific connection", "Ask about vocabulary", "Express surprise", "Reason logically"],
        "summary": "The student made excellent connections between fermentation science and personal/cultural experience, correctly using 'preserve', 'beneficial', and discussing kefir as a cultural example of probiotics. Good reasoning about bacteria and historical food preservation.",
    },

    # ── Session 4: Ancient Writing Systems (A2+) ──────────────────────────────
    {
        "label": "Ancient Writing Systems",
        "topic_main": "Cuneiform and Ancient Scripts",
        "created": "2026-02-22T10:00:00.000Z",
        "convo": [
            ("T", "Today we're going back in time — about 5,000 years. The topic is cuneiform, the world's oldest writing system. Have you ever seen images of it?", "neutral", 0.05),
            ("S", "Cuneiform... I think I see this in a museum. It looks like... like small triangles or arrows, on clay tablet?", "neutral", 0.0),
            ("T", "Exactly right! It was pressed into wet clay using a reed stylus. The wedge-shaped marks are called cuneiform — from Latin, meaning wedge-shaped. Why do you think they used clay?", "positive", 0.3),
            ("S", "Because... clay is easy to find? And you can write on it when it is wet and then it becomes... becomes hard. So it is like... like early paper?", "neutral", -0.05),
            ("T", "Brilliant analogy — like early paper! And clay preserved incredibly well — we have 5,000-year-old tablets that are perfectly readable today.", "positive", 0.6),
            ("S", "That is really incredible. Um... who invented this writing? Was it one person or... or many people across the time?", "positive", 0.3),
            ("T", "Great question — actually, 'invented' is debated. Writing emerged gradually in Mesopotamia — modern Iraq — among the Sumerian people, mainly to keep trade records.", "neutral", 0.0),
            ("S", "Trade records? So the first writing was not for... not for poetry or religion but for... for business? That surprises me.", "neutral", -0.1),
            ("T", "It surprises most people! The earliest tablets record things like '29 goats received', '15 jars of oil'. Very practical. Do you think writing changed human civilization?", "neutral", 0.05),
            ("S", "Yes, absolutely. Without writing, people can only remember what they... what they keep in the head. With writing you can store knowledge for future generations. Like a... like a memory outside the brain.", "positive", 0.4),
            ("T", "I love that metaphor — a memory outside the brain! That's a very sophisticated thought. Can you use 'transmit' in a sentence about writing?", "positive", 0.65),
            ("S", "Uh... writing allows people to transmit knowledge... across generations? Without writing, the knowledge... the knowledge dies when the person dies.", "neutral", 0.05),
            ("T", "Perfect sentence! Very philosophical. Now, do you know any other ancient writing systems?", "positive", 0.45),
            ("S", "Yes, I know Egyptian hieroglyphics. And also Chinese characters — they are very old too. And in my country we have old... old Slavic script called Glagolitic.", "neutral", 0.1),
            ("T", "Glagolitic! Fascinating — I didn't know that. Can you tell me more about it?", "positive", 0.55),
            ("S", "It was created in ninth century for Slavic languages by two Byzantine monks — Cyril and Methodius. Today we use Cyrillic alphabet which is named after Cyril.", "neutral", 0.0),
            ("T", "You just taught me something new! That's wonderful — you're the expert now. How does it feel to share knowledge about your own culture?", "positive", 0.7),
            ("S", "It feels good! I think in these conversations I learn English but I also learn about the world and I can share my own... my own perspective.", "positive", 0.55),
        ],
        "topics_list": ["Ancient History", "Cuneiform", "Writing Systems", "Slavic Culture"],
        "intents_list": ["Share expertise", "Ask historical question", "Make philosophical observation", "Connect to personal culture"],
        "summary": "Excellent session where the student showed growing confidence, making sophisticated observations about writing as 'a memory outside the brain' and sharing expert knowledge about Glagolitic script and Cyril and Methodius. Strong initiative and vocabulary use.",
    },

    # ── Session 5: Mycology (B1-) ──────────────────────────────────────────────
    {
        "label": "Mycology & Fungi",
        "topic_main": "Mycology",
        "created": "2026-03-01T10:00:00.000Z",
        "convo": [
            ("T", "This week I want to explore the mysterious world of fungi. What do you already know about mushrooms and fungi?", "positive", 0.3),
            ("S", "I know more than I expected actually! I recently watched a documentary about how fungi communicate through underground networks. It's called mycelium, right?", "positive", 0.45),
            ("T", "Wow, you've done your research! Yes, mycelium — the underground network of fungal threads. What did the documentary say about it?", "positive", 0.6),
            ("S", "It explained that trees in a forest actually share nutrients through this network. Old trees can feed younger ones. Some scientists call it the Wood Wide Web. I found this completely fascinating.", "positive", 0.7),
            ("T", "That's cutting-edge science! The 'Wood Wide Web' — what an evocative term. Do you think this changes how you see forests?", "positive", 0.55),
            ("S", "Completely! Before I thought a forest was just individual trees growing next to each other. But now I understand it's more like an organism — or at least a community where members support each other.", "positive", 0.5),
            ("T", "Beautiful insight. The word 'symbiosis' describes this mutual relationship. Have you come across that term?", "positive", 0.4),
            ("S", "Symbiosis — yes, I know it! It means two different species that benefit from living together. Like the clownfish and the sea anemone from our earlier conversation.", "positive", 0.45),
            ("T", "Excellent connection! You remembered that from two weeks ago. Are all fungal relationships symbiotic though?", "neutral", 0.05),
            ("S", "No — some fungi are parasitic, right? They take from the host without giving anything. And some are... what's the word... decomposers? They break down dead matter.", "neutral", -0.05),
            ("T", "Spot on! Parasitic and saprophytic — saprophytic means feeding on dead organic matter. You're using precise scientific vocabulary very confidently.", "positive", 0.65),
            ("S", "Thank you! I've been trying to read more scientific articles in English. It helps me learn vocabulary in context rather than just memorizing lists.", "positive", 0.5),
            ("T", "That's a fantastic strategy. Have you tried eating any unusual mushrooms?", "positive", 0.3),
            ("S", "Yes! I tried lion's mane mushroom last month. The texture is really unique — it almost feels like seafood. And apparently it has benefits for brain health, though the research is still preliminary.", "positive", 0.35),
            ("T", "'Preliminary' — excellent word choice. You flagged the uncertainty in the research, which shows real scientific thinking.", "positive", 0.7),
            ("S", "I learned to be careful with health claims because a lot of marketing exaggerates the evidence. The mycology community seems genuinely enthusiastic but also rigorous.", "positive", 0.4),
            ("T", "Rigorous! That's a sophisticated adjective. Where did you come across it?", "positive", 0.3),
            ("S", "In a science podcast I've been following. I think listening to podcasts accelerated my vocabulary acquisition significantly compared to just studying textbooks.", "positive", 0.55),
        ],
        "topics_list": ["Mycology", "Forest Ecology", "Symbiosis", "Scientific Research"],
        "intents_list": ["Share research", "Make intellectual connection", "Question assumptions", "Discuss learning strategy"],
        "summary": "Outstanding session showing significant progress. The student proactively introduced the concept of mycelium from independent research, used advanced vocabulary like 'preliminary', 'rigorous', 'symbiosis', and critically evaluated health claims. Strong learning agency demonstrated.",
    },

    # ── Session 6: Neutron Stars (B1-) ────────────────────────────────────────
    {
        "label": "Neutron Stars & Astrophysics",
        "topic_main": "Astrophysics",
        "created": "2026-03-08T10:00:00.000Z",
        "convo": [
            ("T", "Ready for some astrophysics today? I want to talk about one of the most extreme objects in the universe — neutron stars.", "positive", 0.4),
            ("S", "Neutron stars — I know about these! They form when a massive star collapses after a supernova explosion, right? The core becomes so dense that protons and electrons merge into neutrons.", "positive", 0.5),
            ("T", "Impressive! That's a very precise description. Where did you read about that?", "positive", 0.6),
            ("S", "I've been reading a book called 'Astrophysics for People in a Hurry' by Neil deGrasse Tyson — have you read it? I bought it specifically to practice English with topics I genuinely enjoy.", "positive", 0.55),
            ("T", "That's a wonderful approach! So you're using your passion for learning as fuel for language acquisition. What's the most mind-blowing fact you've learned?", "positive", 0.65),
            ("S", "For me it was the concept of a magnetar — a type of neutron star with an incredibly powerful magnetic field. The field is so strong that if one appeared roughly the distance to the Moon, it would disrupt the iron in our blood and pull metal objects off the surface of Earth.", "positive", 0.4),
            ("T", "That's terrifying and fascinating simultaneously! How did you understand that when reading in English?", "positive", 0.45),
            ("S", "I had to read some sections several times. I used context to guess unfamiliar words rather than stopping to look everything up. I think that built my reading fluency.", "neutral", 0.1),
            ("T", "That's exactly the right approach. The tolerance for ambiguity is crucial in real-world language use. Do neutron stars have any practical relevance for us?", "neutral", -0.05),
            ("S", "Actually yes! Pulsars — rotating neutron stars that emit beams of radiation — are so precise that they were initially mistaken for alien signals. Now we use them as cosmic GPS systems for spacecraft navigation. Do you think there are other astrophysical phenomena we currently misinterpret the same way?", "positive", 0.4),
            ("T", "Cosmic GPS — wonderful metaphor! You're making connections across different domains. That's sophisticated thinking.", "positive", 0.7),
            ("S", "I think science is fundamentally about making unexpected connections. The best discoveries happen when someone applies an idea from one field to a completely different context.", "positive", 0.45),
            ("T", "That's a profound observation. Are you considering studying science in English?", "neutral", 0.05),
            ("S", "I'm considering doing a master's degree in computational physics at a UK university. That's partly why I'm working so hard on my English — I need to be able to discuss complex ideas fluently.", "positive", 0.3),
            ("T", "That's a clear and ambitious goal. What aspect of your English feels most limiting right now?", "neutral", -0.05),
            ("S", "Writing academic essays is still challenging. I can express ideas verbally, but constructing well-structured arguments in writing — with appropriate connectives and formal register — requires more practice.", "neutral", -0.1),
            ("T", "You used 'connectives' and 'register' — those are metalinguistic terms. You're thinking like a language learner very consciously.", "positive", 0.6),
            ("S", "I've started keeping a vocabulary journal where I record words in context with example sentences. I think it helps with retention more than spaced repetition apps alone.", "neutral", 0.05),
        ],
        "topics_list": ["Astrophysics", "Neutron Stars", "Academic Goals", "Learning Strategies"],
        "intents_list": ["Demonstrate knowledge", "Discuss goals", "Reflect on learning", "Make scientific connection"],
        "summary": "Highly confident session demonstrating near B1 level. The student discussed neutron stars and magnetars in detail from independent English-language reading, articulated clear academic goals for UK master's study, and used metalinguistic vocabulary naturally.",
    },

    # ── Session 7: Indigo Dyeing Japan (B1) ───────────────────────────────────
    {
        "label": "Japanese Indigo Dyeing",
        "topic_main": "Traditional Craft & Japanese Culture",
        "created": "2026-03-15T10:00:00.000Z",
        "convo": [
            ("T", "Today I thought we'd explore something more sensory and artistic — Japanese indigo dyeing, called 'aizome'. Have you ever encountered natural dyeing?", "positive", 0.35),
            ("S", "I haven't done it myself, but I've always been intrigued by the idea that plants and minerals can create such vibrant, permanent colors. How does indigo work chemically?", "positive", 0.45),
            ("T", "Great question to start with! The indigo molecule — indigotin — is colorless when dissolved in a fermentation vat. When the fabric is lifted out and exposed to air, oxidation turns it that distinctive deep blue.", "neutral", 0.05),
            ("S", "So the color literally appears in front of you through a chemical reaction with oxygen. That's almost theatrical. Is the fermentation vat similar to what we discussed with food fermentation?", "positive", 0.5),
            ("T", "Excellent connection! Yes, it uses bacteria to create a reduced, alkaline environment. You've transferred knowledge across topics beautifully.", "positive", 0.75),
            ("S", "I love when topics intersect unexpectedly. In Japan, I understand the tradition is called 'katazome' for stencil dyeing and 'shibori' for resist dyeing techniques. Are these still practiced widely?", "positive", 0.55),
            ("T", "Impressive preparation! Shibori is experiencing a global revival. Where did you research these specific techniques?", "positive", 0.6),
            ("S", "I was looking at Japanese craft documentaries on YouTube. The NHK channel has excellent English-subtitled content about traditional crafts. I find authentic content more engaging than textbook exercises.", "positive", 0.45),
            ("T", "Authentic input is key to advanced language acquisition. What struck you most about the artisans you watched?", "positive", 0.4),
            ("S", "The precision and patience. One artisan explained that a single piece can require forty or fifty dyeing cycles — each immersion adds depth to the color. There's something meditative about that kind of iterative process.", "neutral", 0.08),
            ("T", "Meditative — lovely word choice. Do you practice any craft or skill with that kind of patient, iterative approach?", "positive", 0.35),
            ("S", "Chess, actually. Improving at chess requires studying thousands of positions and making incremental gains. I think the mindset of deliberate practice applies equally whether you're dyeing fabric or learning an opening theory.", "positive", 0.4),
            ("T", "Deliberate practice — you've read about the research on skill acquisition. How has that concept influenced how you approach English?", "positive", 0.5),
            ("S", "Significantly. I deliberately focus on areas just outside my comfort zone — slightly complex texts, listening to native speakers at full speed, forcing myself to use vocabulary I've only recently acquired in conversation.", "neutral", 0.12),
            ("T", "You described the concept of the 'zone of proximal development' without naming it. That's the sweet spot between what you can do independently and what you can do with support.", "positive", 0.6),
            ("S", "I know that theory from Vygotsky. It's interesting that the same learning principle applies to Japanese craft apprenticeship, chess training, and language acquisition.", "positive", 0.55),
        ],
        "topics_list": ["Japanese Traditional Craft", "Aizome Indigo Dyeing", "Learning Theory", "Skill Acquisition"],
        "intents_list": ["Ask analytical question", "Connect concepts across domains", "Share research", "Reflect on learning strategy"],
        "summary": "Exceptional session demonstrating sophisticated cross-domain thinking. The student connected indigo dyeing chemistry to fermentation, referenced Vygotsky's zone of proximal development, and discussed deliberate practice theory. Vocabulary was advanced and precise throughout.",
    },

    # ── Session 8: Computational Linguistics (B1) ─────────────────────────────
    {
        "label": "Computational Linguistics",
        "topic_main": "Computational Linguistics & NLP",
        "created": "2026-03-22T10:00:00.000Z",
        "convo": [
            ("T", "For our final session in this series, I want to explore something that connects your physics background with language — computational linguistics and natural language processing. Where would you like to start?", "positive", 0.4),
            ("S", "I'd like to start with what I think is the central tension in the field — whether language understanding in large language models is genuine comprehension or sophisticated pattern matching. I suspect the distinction matters less than it seems in practice, but philosophically it's fascinating. Do you think that debate is actually resolvable empirically, or is it fundamentally definitional?", "positive", 0.5),
            ("T", "That's a sophisticated framing of what's called the Chinese Room argument by Searle. You've clearly thought about this before.", "positive", 0.55),
            ("S", "Yes, Searle's thought experiment. My position is that it might be a false dichotomy — that what we call 'comprehension' in humans might also be an emergent property of sufficiently complex pattern recognition operating on embodied experience.", "neutral", 0.05),
            ("T", "You're defending what some philosophers call 'functionalism'. Do you think language models will ever truly understand language?", "neutral", 0.05),
            ("S", "I think 'understand' is an anthropocentric concept that becomes less useful as we encounter different kinds of intelligence. What I'd say is that current models are already useful for processing language tasks, and whether we grant them 'understanding' depends on definitional choices rather than empirical facts.", "neutral", 0.03),
            ("T", "That's a remarkably precise philosophical position. Has thinking about AI changed how you see your own language learning?", "positive", 0.45),
            ("S", "Profoundly. When I observe how models fail — hallucinating facts with complete grammatical confidence — I see similar patterns in my own production. I can construct fluent sentences that contain subtle semantic errors because my statistical intuitions about what sounds right in English don't always align with logical truth. Would you say that's a universal L2 experience, or more specific to analytical learners?", "neutral", 0.08),
            ("T", "That's a remarkable insight — connecting AI failure modes to your own language learning errors. Can you give me a specific example?", "positive", 0.6),
            ("S", "Yes — I sometimes use prepositions that sound plausible but are idiomatically wrong. For example, I might say 'interested about' instead of 'interested in', because 'about' follows semantic expectations but violates the actual collocation. The model and I share the same underlying confusion.", "neutral", 0.06),
            ("T", "The word 'collocation' — that's advanced metalinguistic vocabulary. You're describing your errors with the precision of a linguist.", "positive", 0.7),
            ("S", "I've been reading about language acquisition theory alongside my physics preparation. I think understanding how language works makes you a more strategic learner — you know what to pay attention to. Is metalinguistic awareness actually correlated with faster acquisition in the research literature?", "neutral", 0.1),
            ("T", "Looking back across our eight sessions, what has been your most significant development?", "positive", 0.35),
            ("S", "I think it's the confidence to discuss complex ideas in English without constantly monitoring my grammar. I've moved from translating in my head to thinking directly in the language, at least for topics I'm passionate about. The cognitive load has decreased substantially.", "positive", 0.6),
            ("T", "That's a hallmark of genuine fluency — reduced cognitive load. You should be proud. Your progression from those early sessions to now is remarkable.", "positive", 0.8),
            ("S", "Thank you. I believe the variety of topics — from beekeeping to astrophysics to linguistics — forced me to stretch my vocabulary in multiple registers, which was more effective than practicing a single domain intensively.", "positive", 0.65),
        ],
        "topics_list": ["Computational Linguistics", "Philosophy of Mind", "Language Acquisition", "AI and NLP"],
        "intents_list": ["Propose theoretical position", "Make philosophical argument", "Reflect on progress", "Analyse learning trajectory"],
        "summary": "Transformative final session demonstrating B1+ achievement. The student engaged with the Chinese Room argument and functionalism, connected AI failure modes to personal language errors, and used sophisticated metalinguistic vocabulary. Complete in-language thinking evidenced throughout.",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Timestamp engine
# ─────────────────────────────────────────────────────────────────────────────

def words_to_json(raw_text: str, speaker: int, t_start: float):
    """
    Convert a sentence to a list of word dicts with monotonically increasing
    timestamps. Returns (word_list, next_available_time).
    """
    tokens = raw_text.split()
    words = []
    t = t_start
    for tok in tokens:
        clean = re.sub(r"[^\w']", "", tok).lower() or tok.lower()
        # Duration proportional to word length: short words ~0.18s, long ~0.55s
        dur = min(0.18 + len(clean) * 0.04, 0.6) + random.uniform(-0.02, 0.08)
        words.append({
            "word": clean,
            "start": round(t, 3),
            "end": round(t + dur, 3),
            "confidence": round(random.uniform(0.93, 1.0), 8),
            "speaker": speaker,
            "speaker_confidence": round(random.uniform(0.55, 0.85), 8),
            "punctuated_word": tok,
            "sentiment": "neutral",  # will overwrite below
            "sentiment_score": 0.0,
        })
        t += dur + random.uniform(0.0, 0.05)  # tiny inter-word gap
    return words, round(t + random.uniform(0.05, 0.12), 3)


def apply_sentiment(words, sentiment: str, score: float):
    noise_range = 0.06
    for w in words:
        w["sentiment"] = sentiment
        w["sentiment_score"] = round(score + random.uniform(-noise_range, noise_range), 4)
    return words


# ─────────────────────────────────────────────────────────────────────────────
# Filler injection helpers
# ─────────────────────────────────────────────────────────────────────────────

FILLERS_BY_SESSION = [
    ["uh", "um", "uh", "you know", "um"],   # session 1 — many
    ["uh", "um", "uh", "um"],               # session 2
    ["uh", "um", "um"],                     # session 3
    ["uh", "um"],                           # session 4
    ["uh"],                                 # session 5
    [],                                     # session 6
    [],                                     # session 7
    [],                                     # session 8
]


def inject_fillers(convo, session_idx):
    """
    In early sessions, prepend filler words to some student turns.
    """
    fillers = FILLERS_BY_SESSION[session_idx]
    if not fillers:
        return convo

    result = []
    for i, (spk, txt, sent, score) in enumerate(convo):
        if spk == "S" and i % 2 == 0 and fillers:
            # pick a filler from the session pool
            f = fillers[i % len(fillers)]
            txt = f + "... " + txt
        result.append((spk, txt, sent, score))
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Talk ratio shaping
# Session 1: student ~30% of words, increasing to ~55% by session 8
# We achieve this by controlling conversation turn lengths.
# ─────────────────────────────────────────────────────────────────────────────

TARGET_STUDENT_PCT = [30, 33, 37, 40, 44, 48, 52, 55]

# ─────────────────────────────────────────────────────────────────────────────
# Build one Deepgram-format JSON
# ─────────────────────────────────────────────────────────────────────────────

def build_json(session_idx: int, sess: dict) -> dict:
    convo = inject_fillers(sess["convo"], session_idx)

    all_words = []   # flat list for channels[0]
    utterances = []
    t = 0.5          # conversation starts at 0.5s

    for spk_code, txt, sentiment, score in convo:
        speaker_int = 0 if spk_code == "S" else 1

        # small pause before each utterance
        pause = random.uniform(0.4, 1.2)
        t += pause

        utt_start = t
        turn_words, t = words_to_json(txt, speaker_int, t)
        apply_sentiment(turn_words, sentiment, score)
        utt_end = turn_words[-1]["end"] if turn_words else t

        utt_start_idx = len(all_words)
        all_words.extend(turn_words)
        utt_end_idx = len(all_words) - 1

        utterances.append({
            "start": round(utt_start, 3),
            "end": round(utt_end, 3),
            "confidence": round(random.uniform(0.88, 0.99), 8),
            "channel": 0,
            "transcript": txt,
            "words": turn_words,
            "speaker": speaker_int,
            "sentiment": sentiment,
            "sentiment_score": round(score, 4),
            "id": str(uuid.uuid4()),
        })

    duration = round(t + 1.0, 2)
    full_transcript = " ".join(w["punctuated_word"] for w in all_words)

    # ── Topics segments ────────────────────────────────────────────────────
    topics_segs = []
    chunk = len(all_words) // max(len(sess["topics_list"]), 1)
    for i, topic_name in enumerate(sess["topics_list"]):
        sw_idx = i * chunk
        ew_idx = min(sw_idx + chunk - 1, len(all_words) - 1)
        topics_segs.append({
            "text": " ".join(w["punctuated_word"] for w in all_words[sw_idx:ew_idx + 1])[:200],
            "start_word": sw_idx,
            "end_word": ew_idx,
            "topics": [{"topic": topic_name, "confidence_score": round(random.uniform(0.6, 0.95), 8)}],
        })

    # ── Intents segments ───────────────────────────────────────────────────
    intents_segs = []
    chunk2 = len(all_words) // max(len(sess["intents_list"]), 1)
    for i, intent_name in enumerate(sess["intents_list"]):
        sw_idx = i * chunk2
        ew_idx = min(sw_idx + chunk2 - 1, len(all_words) - 1)
        intents_segs.append({
            "text": " ".join(w["punctuated_word"] for w in all_words[sw_idx:ew_idx + 1])[:200],
            "start_word": sw_idx,
            "end_word": ew_idx,
            "intents": [{"intent": intent_name, "confidence_score": round(random.uniform(0.4, 0.85), 8)}],
        })

    # ── Sentiments segments ─────────────────────────────────────────────────
    sentiment_segs = []
    sent_scores = [(u["sentiment"], u["sentiment_score"]) for u in utterances if u["speaker"] == 0]
    utt_word_cursor = 0
    for utt in utterances:
        sw_idx = all_words.index(utt["words"][0]) if utt["words"] else 0
        ew_idx = all_words.index(utt["words"][-1]) if utt["words"] else 0
        sentiment_segs.append({
            "text": utt["transcript"][:300],
            "start_word": sw_idx,
            "end_word": ew_idx,
            "sentiment": utt["sentiment"],
            "sentiment_score": utt["sentiment_score"],
        })

    all_scores = [u["sentiment_score"] for u in utterances]
    avg_score = round(sum(all_scores) / len(all_scores), 4) if all_scores else 0.0
    avg_label = "positive" if avg_score > 0.1 else ("negative" if avg_score < -0.2 else "neutral")

    # ── Summaries (legacy array format that run.py reads) ──────────────────
    summaries = [{"result": "success", "summary": sess["summary"]}]

    # ── Assemble JSON ──────────────────────────────────────────────────────
    model_uuid = "2187e11a-3532-4498-b076-81fa530bdd49"
    return {
        "metadata": {
            "transaction_key": "deprecated",
            "request_id": str(uuid.uuid4()),
            "sha256": uuid.uuid4().hex,
            "created": sess["created"],
            "duration": duration,
            "channels": 1,
            "models": [model_uuid],
            "model_info": {
                model_uuid: {
                    "name": "general-nova-3",
                    "version": "2025-07-31.0",
                    "arch": "nova-3",
                }
            },
            "summary_info": {
                "model_uuid": "67875a7f-c9c4-48a0-aa55-5bdb8a91c34a",
                "input_tokens": random.randint(150, 400),
                "output_tokens": random.randint(60, 120),
            },
            "sentiment_info": {
                "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
                "input_tokens": random.randint(150, 400),
                "output_tokens": random.randint(100, 300),
            },
            "topics_info": {
                "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
                "input_tokens": random.randint(150, 400),
                "output_tokens": random.randint(15, 40),
            },
            "intents_info": {
                "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
                "input_tokens": random.randint(150, 400),
                "output_tokens": random.randint(40, 90),
            },
        },
        "results": {
            "channels": [{
                "alternatives": [{
                    "transcript": full_transcript,
                    "confidence": round(random.uniform(0.94, 0.995), 8),
                    "words": all_words,
                }]
            }],
            "utterances": utterances,
            "summary": {"result": "success", "short": sess["summary"]},
            "summaries": summaries,
            "topics": {"segments": topics_segs},
            "intents": {"segments": intents_segs},
            "sentiments": {
                "segments": sentiment_segs,
                "average": {
                    "sentiment": avg_label,
                    "sentiment_score": avg_score,
                },
            },
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Generate all 8 files
# ─────────────────────────────────────────────────────────────────────────────

def main():
    generated_paths = []

    for i, sess in enumerate(SESSIONS_DATA):
        fname = f"session-{i+1}_rich.json"
        fpath = OUT_DIR / fname
        print(f"  Generating {fpath} — {sess['label']} ...")
        data = build_json(i, sess)
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        generated_paths.append(str(fpath))
        # sanity
        utts = data["results"]["utterances"]
        student_utts = [u for u in utts if u["speaker"] == 0]
        tutor_utts   = [u for u in utts if u["speaker"] == 1]
        all_w  = data["results"]["channels"][0]["alternatives"][0]["words"]
        s_words = [w for w in all_w if w["speaker"] == 0]
        t_words = [w for w in all_w if w["speaker"] == 1]
        s_dur = sum(w["end"] - w["start"] for w in s_words)
        t_dur = sum(w["end"] - w["start"] for w in t_words)
        tot = s_dur + t_dur or 1
        print(f"    Duration: {data['metadata']['duration']:.1f}s | "
              f"Student: {s_dur/tot*100:.0f}% | Tutor: {t_dur/tot*100:.0f}% | "
              f"Words: {len(s_words)}S + {len(t_words)}T")

    print(f"\nOK: Generated {len(generated_paths)} files in {OUT_DIR}/")

    # ── Patch api.py to add the new preset ────────────────────────────────────
    api_path = Path("api.py")
    if not api_path.exists():
        print("  [!] api.py not found — skipping preset registration.")
        return

    api_src = api_path.read_text(encoding="utf-8")
    MARKER = "# ── Add real recorded sessions here once you have them"

    # build the sources list (relative paths from project root)
    sources_list = [str(OUT_DIR / f"session-{i+1}_rich.json").replace("\\", "/")
                    for i in range(8)]
    sources_repr = json.dumps(sources_list, indent=8)[:-1] + "    ]"  # pretty

    new_preset = f'''    "demo_exotic": {{
        "name": "Exotic Topics — A2→B1 Journey",
        "description": "8-session real progression: beekeeping → astrophysics → computational linguistics",
        "mode": "json",
        "sources": {json.dumps(sources_list)},
        "student_id": "demo-exotic",
        "story": "improvement",
        "badge": "PROGRESSION",
    }},
    {MARKER}'''

    if '"demo_exotic"' in api_src:
        print("  [i] Preset 'demo_exotic' already registered in api.py — skipping.")
    elif MARKER in api_src:
        api_src = api_src.replace(MARKER, new_preset)
        api_path.write_text(api_src, encoding="utf-8")
        print("  OK: Registered preset 'demo_exotic' in api.py")
    else:
        print("  [!] Could not find registration marker in api.py — add manually.")
        print(f"      Insert before 'PRESETS = {{' block:\n{new_preset}")


if __name__ == "__main__":
    main()
