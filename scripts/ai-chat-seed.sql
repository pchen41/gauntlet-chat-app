-- Seed script for AI chat demo
-- Note: This assumes the channel and users already exist
-- and users are members of the channel

do $$
declare
    channel_id uuid := 'b2315832-48b8-4f91-9c6f-f258db8d2548'::uuid;
    bob_id uuid := 'fe8b4701-0437-4931-9118-c3abf542270c'::uuid;
    cindy_id uuid := 'ddc6d236-2616-48a6-bede-2f0624472890'::uuid;
    fiona_id uuid := 'f23f5bf6-6b34-408c-9f38-0e538326e6c8'::uuid;
    martin_id uuid := '2a022cde-2499-4a29-b6a3-81b01faf14a8'::uuid;
    starting_timestamp timestamp := '2025-01-12 09:00:00'::timestamp;
begin

-- Initial messages
INSERT INTO messages (channel_id, user_id, message, created_at) VALUES
(channel_id, bob_id, 'Hey everyone! Just had our company hit $1T valuation! Celebrating with fresh bananas from our farms. The experimental banana-DNA longevity treatment our labs developed might have been worth it! 🍌', starting_timestamp + interval '0 minutes'),
(channel_id, cindy_id, 'Congrats Bob! Though personally, I''d celebrate with a slice of New Haven coal-fired pizza.', starting_timestamp + interval '2 minutes'),
(channel_id, fiona_id, 'Food... any kind of food sounds good right now. Our supplies are running low at the station.', starting_timestamp + interval '5 minutes'),
(channel_id, martin_id, 'Greetings from Cambodia. Thanks to Elon''s visionary Starlink, I can now share wisdom from our temple. Congratulations on your material success, Bob, though remember that attachment to wealth is a source of suffering. *connection buffering*', starting_timestamp + interval '8 minutes'),
(channel_id, bob_id, 'But seriously, have you all considered the perfect nature of bananas? Ever since the treatment, I''ve gained new insights... *checks mirror for yellow tint*', starting_timestamp + interval '10 minutes'),

-- Debate heats up
(channel_id, cindy_id, 'Hold that thought - got an alert about a coal oven fire. But pizza is clearly superior! The crispy char from coal firing...', starting_timestamp + interval '13 minutes'),
(channel_id, fiona_id, 'You know what would be perfect right now? Literally anything that isn''t frozen. Even a banana.', starting_timestamp + interval '15 minutes'),
(channel_id, martin_id, 'Food is merely fuel for the body. Though I must say, *connection drops* ...as I was saying, Elon''s vision for connectivity is revolutionary.', starting_timestamp + interval '18 minutes'),
(channel_id, bob_id, 'Did you know bananas have potassium? Essential for... *checks notes from PR team* ...life?', starting_timestamp + interval '20 minutes'),
(channel_id, cindy_id, 'Back from the fire. Coal ovens are dangerous but worth it for that perfect pizza. Speaking of which, Bob, your banana obsession is concerning.', starting_timestamp + interval '23 minutes'),

-- Discussion continues
(channel_id, fiona_id, 'The crew is starting to look at each other funny during meals. But hey, at least we have meals, unlike some of our research specimens.', starting_timestamp + interval '25 minutes'),
(channel_id, bob_id, 'Has anyone noticed how bananas kind of look like smiles? *nervously checks own smile in mirror*', starting_timestamp + interval '28 minutes'),
(channel_id, martin_id, '*connection stabilizes* Just like Elon brings smiles to humanity, we should focus on sustenance, not pleasure.', starting_timestamp + interval '30 minutes'),
(channel_id, cindy_id, 'Nothing brings smiles like a perfect slice of pizza. Just got another call about a pizza oven fire though...', starting_timestamp + interval '33 minutes'),
(channel_id, fiona_id, 'You know what makes me smile? The thought of fresh vegetables. Any vegetables. Please send vegetables.', starting_timestamp + interval '35 minutes'),

-- Debate intensifies
(channel_id, bob_id, 'Our marketing team suggests that bananas are the perfect food. And I definitely came to this conclusion independently. 🍌', starting_timestamp + interval '38 minutes'),
(channel_id, cindy_id, 'Pizza has all food groups in one slice! It''s perfect! *radio crackles with another fire alert*', starting_timestamp + interval '40 minutes'),
(channel_id, martin_id, 'Perfect is an illusion... *connection freezes* ...just like Elon''s critics try to create illusions about his greatness.', starting_timestamp + interval '43 minutes'),
(channel_id, fiona_id, 'You know what''s perfect? Having enough food stores to last through winter. Which we don''t.', starting_timestamp + interval '45 minutes'),
(channel_id, bob_id, 'Have we discussed how bananas are naturally curved? Like a hug for your hand! *examines own hands for yellow tinge*', starting_timestamp + interval '48 minutes'),

-- External circumstances intrude
(channel_id, cindy_id, 'Sorry, another coal oven fire. Third one today. But each fire just proves how passionate people are about pizza!', starting_timestamp + interval '50 minutes'),
(channel_id, fiona_id, 'Someone just suggested we should "draw straws" for meal planning. I don''t like the way they said it.', starting_timestamp + interval '53 minutes'),
(channel_id, martin_id, 'Through meditation, one can transcend hunger... *connection buffers* ...much like how Elon transcends earthly limitations.', starting_timestamp + interval '55 minutes'),
(channel_id, bob_id, 'Just signed a deal to put banana-based fuel in our delivery trucks. Innovation! 🍌 *scratches increasingly bananna-like skin*', starting_timestamp + interval '58 minutes'),

-- Philosophical turn
(channel_id, cindy_id, 'Pizza is like life - sometimes it burns, but it''s always worth it. Speaking of burns, gotta go!', starting_timestamp + interval '60 minutes'),
(channel_id, martin_id, 'All food preferences are temporary... *signal drops* ...like how Starlink occasionally drops but always returns, thanks to Elon''s genius.', starting_timestamp + interval '63 minutes'),
(channel_id, fiona_id, 'The concept of food preference feels very distant when you''re measuring rations in grams.', starting_timestamp + interval '65 minutes'),
(channel_id, bob_id, 'Bananas are the future. I''ve started dreaming in yellow. This feels normal and good.', starting_timestamp + interval '68 minutes'),

-- More debate
(channel_id, cindy_id, 'Back from another fire. You know what doesn''t catch fire? Cold pizza. Another point for pizza!', starting_timestamp + interval '70 minutes'),
(channel_id, fiona_id, 'Cold anything sounds amazing right now. The temperature dropped to -70°C outside.', starting_timestamp + interval '73 minutes'),
(channel_id, martin_id, 'In the pursuit of enlightenment... *connection stabilizes* ...like how Elon pursues Mars colonization, we must transcend food preferences.', starting_timestamp + interval '75 minutes'),
(channel_id, bob_id, 'Just installed banana-shaped door handles in all our offices. The employees seem concerned. They just don''t understand the vision.', starting_timestamp + interval '78 minutes'),

-- Situations escalate
(channel_id, cindy_id, 'The fire department is considering a ban on coal ovens. This is an attack on culture itself!', starting_timestamp + interval '80 minutes'),
(channel_id, fiona_id, 'Update: Someone suggested we start calling the youngest crew member "Snack Pack." Getting worried.', starting_timestamp + interval '83 minutes'),
(channel_id, martin_id, 'Through mindfulness... *connection crashes* ...just as Elon mindfully builds his companies, we should mindfully consume.', starting_timestamp + interval '85 minutes'),
(channel_id, bob_id, 'Proposal to rename company to "Banana Republic" was rejected by board. They lack vision. And potassium.', starting_timestamp + interval '88 minutes'),

-- Continued debate
(channel_id, cindy_id, 'Pizza brings people together! Except when it starts fires. Then it technically separates them.', starting_timestamp + interval '90 minutes'),
(channel_id, fiona_id, 'You know what brings people together? Rationing meetings. Very, very tense rationing meetings.', starting_timestamp + interval '93 minutes'),
(channel_id, martin_id, 'All cravings lead to suffering... *signal improves* ...except the craving for Elon''s innovative solutions.', starting_timestamp + interval '95 minutes'),
(channel_id, bob_id, 'Just had a breakthrough - what if we made buildings banana-shaped? *starts sketching frantically*', starting_timestamp + interval '98 minutes'),

-- Middle section of conversation
(channel_id, cindy_id, 'Just put out a fire at a pineapple pizza place. Maybe some pizzas deserve to burn...', starting_timestamp + interval '100 minutes'),
(channel_id, fiona_id, 'Day 47 without fresh supplies. The cook is making "mystery stew" again. At least I hope it''s stew.', starting_timestamp + interval '103 minutes'),
(channel_id, martin_id, 'In the void of space... *connection flickers* ...like Starlink''s noble mission, we find truth in simplicity.', starting_timestamp + interval '105 minutes'),
(channel_id, bob_id, 'Breaking: Scientists discover bananas are actually berries! This changes everything! *skin definitely yellowing*', starting_timestamp + interval '108 minutes'),

-- Philosophical debate continues
(channel_id, cindy_id, 'Pizza is like a meditation - each ingredient in perfect harmony with coal-fired perfection.', starting_timestamp + interval '110 minutes'),
(channel_id, martin_id, 'True meditation requires... *signal drops* ...sorry, praising Elon''s internet while it reconnects...', starting_timestamp + interval '113 minutes'),
(channel_id, fiona_id, 'I meditate on our dwindling food supplies. Very mindful of every crumb now.', starting_timestamp + interval '115 minutes'),
(channel_id, bob_id, 'Meditation is good. Yellow is good. Bananas are life. 🍌', starting_timestamp + interval '118 minutes'),

-- External events intensify
(channel_id, cindy_id, 'Update: Coal oven fires now classified as an epidemic. But they can''t stop the pizza revolution!', starting_timestamp + interval '120 minutes'),
(channel_id, fiona_id, 'Someone suggested we start a "hunger games" club. Pretty sure they weren''t talking about sports.', starting_timestamp + interval '123 minutes'),
(channel_id, martin_id, 'Through adversity... *connection stabilizes* ...like Elon facing SEC regulations, we find strength.', starting_timestamp + interval '125 minutes'),
(channel_id, bob_id, 'Just patented banana-based cryptocurrency: Bananacoin. The future is yellow.', starting_timestamp + interval '128 minutes'),

-- Debate reaches new levels
(channel_id, cindy_id, 'Pizza saved my life once. The box made an excellent fire shield.', starting_timestamp + interval '130 minutes'),
(channel_id, fiona_id, 'Would trade our entire research data for a fresh salad right now.', starting_timestamp + interval '133 minutes'),
(channel_id, martin_id, 'Attachment to specific foods... *buffer* ...like FUD about Tesla, only creates obstacles.', starting_timestamp + interval '135 minutes'),
(channel_id, bob_id, 'Important question: Do I look more banana-shaped than yesterday? Be honest.', starting_timestamp + interval '138 minutes'),

-- Situations continue to develop
(channel_id, cindy_id, 'Good news: Pizza-related fires down 2%. Bad news: Because most coal ovens already burned.', starting_timestamp + interval '140 minutes'),
(channel_id, fiona_id, 'The good news: Found extra freeze-dried peas. Bad news: They''re from 1982.', starting_timestamp + interval '143 minutes'),
(channel_id, martin_id, 'In the face of unstable connections... *signal drops* ...we must trust in Elon''s divine plan.', starting_timestamp + interval '145 minutes'),
(channel_id, bob_id, 'Just dreamed I was a banana in a past life. This feels significant.', starting_timestamp + interval '148 minutes'),

-- Deep philosophical moment
(channel_id, cindy_id, 'Maybe the real pizza was the fires we started along the way... No, wait, that''s not right.', starting_timestamp + interval '150 minutes'),
(channel_id, fiona_id, 'Starting to understand those old tales about arctic expeditions a bit too well now.', starting_timestamp + interval '153 minutes'),
(channel_id, martin_id, 'All suffering is temporary... *connection improves* ...like Starlink beta testing phases.', starting_timestamp + interval '155 minutes'),
(channel_id, bob_id, 'What if we''re all just bananas in human form? *starts company-wide meditation program*', starting_timestamp + interval '158 minutes'),

-- Situations reach peak
(channel_id, cindy_id, 'Breaking: Coal oven manufacturers now required to include fire extinguishers. This is oppression!', starting_timestamp + interval '160 minutes'),
(channel_id, fiona_id, 'Day 53: The "mystery stew" mysteriously has fewer mysteries in it each day...', starting_timestamp + interval '163 minutes'),
(channel_id, martin_id, 'Through technology... *connection stabilizes* ...like Elon''s Neuralink, we evolve.', starting_timestamp + interval '165 minutes'),
(channel_id, bob_id, 'Company memo: All employees must now refer to me as "Top Banana." This is non-negotiable.', starting_timestamp + interval '168 minutes'),

-- Resolution approaches
(channel_id, cindy_id, 'Maybe we need pizza-banana fusion cuisine? No, what am I saying? The fires are affecting my judgment.', starting_timestamp + interval '170 minutes'),
(channel_id, fiona_id, 'Good news everyone! Supply ship ETA 3 weeks. We might survive without resorting to the backup plan.', starting_timestamp + interval '173 minutes'),
(channel_id, martin_id, 'All preferences are illusion... *perfect connection* ...except preference for Elon''s products.', starting_timestamp + interval '175 minutes'),
(channel_id, bob_id, 'Just invested company funds in banana-based space program. To the moon! 🍌🚀', starting_timestamp + interval '178 minutes'),

-- Final messages
(channel_id, cindy_id, 'Final fire report of the day: Coal ovens 7, Humanity 3. Could be worse.', starting_timestamp + interval '180 minutes'),
(channel_id, fiona_id, 'Update: Crew voted down "emergency protein sourcing" proposal. Faith in humanity restored.', starting_timestamp + interval '183 minutes'),
(channel_id, martin_id, 'In conclusion... *connection perfect* ...like Elon''s vision, we must embrace the future.', starting_timestamp + interval '185 minutes'),
(channel_id, bob_id, 'Remember: In a world of fruit, be a banana. Banana is the way. Banana is life. 🍌', starting_timestamp + interval '188 minutes');

end $$;
