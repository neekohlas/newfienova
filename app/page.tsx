import Hero from '@/components/Hero';
import Post from '@/components/Post';
import ProgressBar from '@/components/ProgressBar';
import ChapterDivider from '@/components/ChapterDivider';
import AIContextNote from '@/components/AIContextNote';
import RouteMap from '@/components/RouteMap';
import Navigation from '@/components/Navigation';
import locationData from '@/data/locations.json';
import imageMatchesData from '@/data/image-matches.json';
import imageCaptionsData from '@/data/image-captions.json';
import { buildGlobalMediaArray, MediaItem } from '@/lib/media-utils';
import fs from 'fs/promises';
import path from 'path';

// Async function to read posts data dynamically - truly uncached
async function getPostsData() {
  const filePath = path.join(process.cwd(), 'data/posts.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// AI Context Notes - these provide historical/cultural context
const contextNotes: { [postId: string]: { title: string; content: string }[] } = {
  '2443287259016875260': [
    {
      title: 'Vegetable Oil Diesel Conversions',
      content:
        `In the mid-2000s, converting diesel vehicles to run on waste vegetable oil (WVO) became a grassroots movement among environmentalists, DIY enthusiasts, and frugal travelers. The appeal was simple: restaurants paid to dispose of their used fryer oil, so resourceful drivers could fuel their vehicles for free while recycling waste.

Mercedes-Benz diesel engines from the 1970s and 1980s became the gold standard for these conversions. Their robust Bosch mechanical fuel injection systems—designed before the era of electronic sensors and computerized engine management—could handle the thicker viscosity of vegetable oil without complaint. The W123 chassis (1976-1985) and W124 (1984-1995) wagons were particularly prized for their reliability and cargo capacity.

The conversion typically involved adding a second fuel tank for the vegetable oil, a heat exchanger to warm the oil using engine coolant (since cold vegetable oil is too thick to flow properly), and a switching system to start on diesel and switch to WVO once the engine warmed up. Some purists ran "straight vegetable oil" (SVO) systems, while others converted their oil to biodiesel through a chemical process involving methanol and lye.

The community that grew around "grease cars" was passionate and resourceful. Online forums shared tips on the best restaurants to approach, how to filter and dewater used oil, and which seals and hoses needed upgrading to handle the different fuel. For many, it wasn't just about saving money—it was a statement about energy independence and sustainability.`,
    },
  ],
  '4436043589922946853': [
    {
      title: 'The Mercedes W123: An Unlikely Adventure Vehicle',
      content:
        `The Mercedes-Benz W123, produced from 1976 to 1985, earned a reputation as one of the most durable automobiles ever manufactured. In developing countries, these cars routinely exceeded 500,000 miles as taxis, and some have crossed the million-mile mark. This legendary reliability made them ideal for unconventional adventures.

The W123's appeal for vegetable oil conversion went beyond durability. Its pre-electronic diesel engine used a purely mechanical fuel injection system that didn't rely on sensors calibrated for petroleum diesel. The indirect injection design was more forgiving of fuel variations, and the robust internals could handle the slightly different combustion characteristics of vegetable oil.

For travelers, the wagon (estate) variant offered practical advantages: generous cargo space for bikes, camping gear, and jugs of filtered fryer oil, plus a fold-flat rear area that could serve as a sleeping platform. The car's understated elegance—still clearly a Mercedes but without flashy styling—helped travelers blend in rather than attract unwanted attention.

By 2008, finding a well-maintained W123 required patience. The cars were 23-30 years old, and while mechanically sound examples still existed, rust and neglected maintenance had claimed many. Those that survived were often cherished by enthusiasts who appreciated their combination of simplicity, comfort, and seemingly infinite lifespan.`,
    },
  ],
  '8720269709604075403': [
    {
      title: 'The Cèilidh: Cape Breton\'s Living Musical Tradition',
      content:
        `The cèilidh (pronounced "KAY-lee") that the travelers attended at Highland Village represents one of Cape Breton's most treasured cultural traditions. These informal musical gatherings have roots stretching back centuries to Scotland and Ireland, brought to Nova Scotia by immigrants fleeing the Highland Clearances in the 18th and 19th centuries.

Unlike formal concerts, a cèilidh is participatory and communal. The word itself comes from Scottish Gaelic meaning "visit" or "social call." In Cape Breton, these gatherings typically feature fiddle music in the distinctive Cape Breton style—characterized by driving rhythms, intricate ornamentation, and a repertoire of strathspeys, reels, and jigs passed down through generations.

Highland Village, where the travelers stopped, is a living history museum in Iona that preserves and celebrates Gaelic culture. Perched on a hillside overlooking the Bras d'Or Lakes, it features historic buildings relocated from across Cape Breton and regular demonstrations of traditional crafts, music, and dance. The cèilidhs held there offer visitors an authentic taste of the culture that still thrives in Cape Breton's rural communities.

Step dancing often accompanies the fiddle music—a percussive dance style performed in hard-soled shoes that adds rhythmic complexity to the music. Unlike Irish step dancing, which emphasizes upper body stillness, Cape Breton step dancing allows for more relaxed, natural movement. The combination of fiddle, piano accompaniment, and step dancing creates an irresistible energy that draws even reluctant participants onto the floor.`,
    },
  ],
  '8413902366549795657': [
    {
      title: 'The Art of the Improvised Tandem',
      content:
        `The tandem bicycle described in this post—cobbled together from two separate bikes with improvised pivot points—represents a remarkable feat of roadside engineering, even if the result proved spectacularly unstable. The ingenuity required to merge two bicycles into one functional (if briefly) tandem deserves recognition.

Building a tandem from standard bicycles requires solving several engineering challenges. The frame must be extended to accommodate two riders while maintaining structural integrity. The steering must allow the front rider (captain) to control direction while the rear rider (stoker) pedals in sync. Most critically, the drivetrain must be synchronized so both riders contribute power efficiently.

The instability the riders experienced likely stemmed from the dual pivot points in their improvised design. A proper tandem frame is rigid, with the two seating positions welded into a single continuous structure. The pivot points in the improvised version would have introduced flex and unpredictable handling, particularly at speed or in crosswinds. Every pedal stroke from the rear rider would transfer forces through the pivots differently, making the bike feel like it was constantly trying to fold or twist.

Tandem cycling, when done on a properly constructed bike, offers significant advantages for touring. Two riders can maintain higher speeds with less effort due to reduced wind resistance per person. The stronger rider can compensate for the weaker one on climbs. Communication is easier than on separate bikes. But all these benefits depend on a stable, well-designed frame—something that's nearly impossible to achieve with roadside improvisation and borrowed parts.`,
    },
  ],
  '5441908429057639276': [
    {
      title: 'The Marine Atlantic Ferry',
      content:
        `The ferry crossing from North Sydney, Nova Scotia to Port aux Basques, Newfoundland is more than transportation—it's a threshold between worlds. The 96-nautical-mile journey across the Cabot Strait takes approximately 6-8 hours under normal conditions and has connected Newfoundland to mainland Canada since confederation in 1949.

Before the ferry service, Newfoundland's isolation was profound. The island had developed its own distinct culture, accent, and way of life over centuries of separation. The ferry changed everything, enabling the flow of goods, people, and ideas that would gradually integrate Newfoundland into the Canadian mainstream—for better and worse.

The Cabot Strait crossing can be notoriously rough. The strait funnels weather systems between the Gulf of St. Lawrence and the Atlantic Ocean, creating conditions that have humbled many travelers. Fog is common, especially in summer when warm air meets the cold Labrador Current. When severe storms move through, conditions can become so dangerous that ferries must wait outside the harbor rather than attempt to dock—passengers have reported delays of up to three days while the ship rides out weather just offshore, unable to safely enter port.

For cyclists, the ferry represents both an ending and a beginning. The comfortable mainland roads of Nova Scotia give way to Newfoundland's wilder, more remote landscape. Many cyclists report feeling the cultural shift before they even disembark—the accents of fellow passengers, the pace of conversation, the sense of entering somewhere genuinely different.`,
    },
    {
      title: 'Newfoundland: The Reluctant Province',
      content:
        `Newfoundland's entry into Canadian Confederation in 1949 remains one of the most contentious political events in the province's history. The vote was close—52.3% in favor—and the wounds from that decision have never fully healed. Many Newfoundlanders still debate whether joining Canada was the right choice.

For nearly 500 years before confederation, Newfoundland had charted its own course. It was England's first overseas colony, claimed in 1497 when John Cabot landed at what is now Bonavista. The island developed around the cod fishery, with generations of families building lives in isolated coves and harbors along its 17,500 kilometers of coastline.

Joey Smallwood, the journalist and politician who championed confederation, became Newfoundland's first premier and dominated its politics for over two decades. His vision was modernization at any cost. He attracted industries with generous subsidies, built roads into remote areas, and most controversially, relocated thousands of people from isolated outport communities to larger "growth centers."

The debate over Smallwood's legacy continues. Supporters credit him with dragging Newfoundland into the 20th century, bringing electricity, roads, and social services to communities that had none. Critics argue he destroyed a unique way of life, encouraged dependency on government, and made decisions that benefited mainland Canadian interests over Newfoundland's own. The phrase "Confederate" remains loaded in some communities.`,
    },
  ],
  '6596045885944420226': [
    {
      title: 'The Trans-Canada Highway in Newfoundland',
      content:
        `The Trans-Canada Highway's Newfoundland section, completed in 1965, was an engineering triumph that transformed the island. Before the highway, traveling across Newfoundland meant taking coastal steamers or navigating a patchwork of rough roads that became impassable in winter. The new route cut travel time dramatically and opened the interior for the first time.

Route 1 stretches 905 kilometers from Port aux Basques to St. John's, making it one of the longest provincial sections of the Trans-Canada. The highway crosses some of the most challenging terrain in eastern North America: the Long Range Mountains, the vast interior barrens, and countless river valleys that required bridges.

For cyclists, the highway is a mixed blessing. It provides a direct route across the island and is generally well-maintained. However, the shoulders are often narrow, the traffic includes heavy trucks, and the distances between services can stretch to 100 kilometers or more. Many cyclists choose to supplement their route with coastal roads, accepting additional distance for improved safety and scenery.

The highway's construction came with hidden costs. Several communities that had relied on coastal boat service found themselves bypassed, accelerating their decline. The road also opened previously inaccessible areas to development, changing the character of the interior. For better or worse, the Trans-Canada made Newfoundland navigable in ways it had never been before.`,
    },
  ],
  '796356104313857900': [
    {
      title: 'Newfoundland Hospitality: A Cultural Tradition',
      content:
        `Newfoundlanders have earned a global reputation for extraordinary hospitality, a trait that visitors consistently remark upon. This isn't mere friendliness—it's a deep cultural value rooted in centuries of isolation and interdependence.

In the outport communities that dotted Newfoundland's coastline, survival depended on mutual aid. When fishing boats were lost in storms, neighbors took in the widows and orphans. When supplies ran low before the spring thaw, families shared what they had. Helping strangers wasn't just courteous—it was insurance that help would come when you needed it. The phrase "Come from Away" (CFA) describes non-Newfoundlanders, but the term carries no hostility; it's simply a recognition of the deep local bonds that newcomers haven't yet formed.

This hospitality became world-famous after September 11, 2001, when 38 planes carrying nearly 7,000 passengers were diverted to Gander, Newfoundland after American airspace closed. The town of 10,000 absorbed the stranded travelers for days, opening their homes, schools, and churches. The story inspired the Broadway musical "Come From Away," but Newfoundlanders insist they did nothing unusual—just what anyone would do.

Visitors today still experience this warmth. Cyclists report being flagged down by passing motorists offering water or directions. Strangers invite travelers into their kitchens for tea. In rural areas, it's not uncommon to arrive at a destination and find that word of your journey preceded you, spread by a network of curious and welcoming locals.`,
    },
  ],
  '8024991348506127223': [
    {
      title: 'The Newfoundland Time Zone',
      content:
        `Newfoundland operates on its own time zone, 30 minutes ahead of Atlantic Time and 90 minutes ahead of Eastern Time. This half-hour offset makes it unique in North America and reflects the island's historical independence and geographical position as the easternmost point in the continent.

The unusual time zone dates to 1935, when Newfoundland standardized its clocks. As a self-governing dominion (not yet part of Canada), Newfoundland chose a time that roughly matched solar noon in St. John's. The half-hour increment was a practical compromise between full hour zones to the east and west.

When Newfoundland joined Canada in 1949, there was pressure to conform to Atlantic Time, but the island resisted. The time zone had become a point of pride, a small assertion of distinctiveness in the face of confederation. To this day, national radio and television broadcasts end with "...and 30 minutes later in Newfoundland."

For travelers, the time zone creates minor complications. Cell phones sometimes struggle to update automatically. Scheduling calls with the mainland requires extra mental math. Ferry schedules must be read carefully—departure times are listed in local time, which changes mid-voyage. Yet many visitors come to appreciate this temporal quirk as part of what makes Newfoundland feel like a place apart, operating on its own terms.`,
    },
  ],
  '3993531002004072255': [
    {
      title: 'Corner Brook: Newfoundland\'s Western Capital',
      content:
        `Corner Brook, nestled at the head of the Bay of Islands on Newfoundland's west coast, serves as the island's second-largest city and the unofficial capital of western Newfoundland. With a population of around 20,000, it offers services and amenities that cyclists traveling the western route come to appreciate after days in more remote areas.

The city owes its existence to the pulp and paper industry. The Corner Brook Pulp and Paper Mill, opened in 1925, transformed what had been a small trading post into an industrial center. For decades, the mill was the economic engine of western Newfoundland, and its influence shaped the city's development. Though the industry has declined, the mill continues to operate, and its distinctive smell still drifts across the city on certain days.

Corner Brook's setting is dramatic, surrounded by the Blow Me Down Mountains and fronting on one of Newfoundland's most beautiful bays. The city has worked to develop tourism as the traditional industries fade, promoting itself as a gateway to Gros Morne National Park and the Viking Trail. The Marble Mountain ski resort, just outside town, draws winter visitors.

For touring cyclists, Corner Brook represents a significant milestone—roughly the halfway point across the island for those traveling the northern route. The city offers the last major resupply opportunity before the long, remote stretch of the Trans-Canada through central Newfoundland. Many cyclists take a rest day here, appreciating the restaurants, laundromats, and bike shops that smaller communities lack.`,
    },
  ],
  '4096416394657787735': [
    {
      title: 'Wild Berries of Newfoundland',
      content:
        `Newfoundland's barrens—those windswept expanses of low shrubs, mosses, and exposed rock—harbor one of North America's great foraging treasures. In late summer, these seemingly barren landscapes transform into carpets of wild berries, a bounty that has sustained both indigenous peoples and European settlers for centuries.

The bakeapple, known elsewhere as cloudberry (Rubus chamaemorus), is perhaps Newfoundland's most prized berry. These amber-colored fruits grow in boggy areas and ripen in August, producing a unique flavor that's been described as a cross between apple and raspberry with honey notes. Bakeapple jam is a Newfoundland delicacy, and serious pickers guard their favorite patches jealously. The berries are so valued that Newfoundlanders have been known to drive hours to reach productive areas.

Partridgeberries (known as lingonberries in Scandinavia) carpet the forest floor and barrens in red each autumn. These tart berries keep well without refrigeration thanks to their natural benzoic acid content, making them invaluable in pre-refrigeration days. Partridgeberry jam and partridgeberry pie remain staples of Newfoundland cuisine.

Blueberries grow abundantly throughout the province, and commercial blueberry operations have expanded significantly. Wild blueberries, smaller and more intensely flavored than their cultivated cousins, can be picked by the gallon along roadsides and in cleared areas. For cyclists traveling in late summer, the berries provide free, delicious sustenance—and a welcome excuse to stop and rest.`,
    },
  ],
  '7651708599130678867': [
    {
      title: 'Gros Morne National Park',
      content:
        `Gros Morne National Park, a UNESCO World Heritage Site since 1987, protects some of the most spectacular and geologically significant landscapes in eastern North America. For cyclists traveling Newfoundland's west coast, the park represents both a highlight and a challenge—stunning scenery paired with demanding terrain.

The park's name comes from the French for "large mountain" and refers to the second-highest peak in Newfoundland, which rises 806 meters above sea level. But the mountain is just one attraction. Western Brook Pond, actually a landlocked fjord carved by glaciers, features cliffs that rise 600 meters from the water. The Tablelands, a rust-colored plateau, expose rock from the Earth's mantle—one of the few places on the planet where you can walk on what was once deep beneath the ocean floor.

The geology tells a story of continental collision. Around 500 million years ago, the ancient Iapetus Ocean closed as continents converged, pushing ocean floor up and over continental crust. The result is a textbook example of plate tectonics, attracting geologists from around the world. The barren, almost Martian landscape of the Tablelands results from the mantle rock's toxicity to most plants.

For cyclists, Highway 430 through the park offers challenging but rewarding riding. The road climbs over several significant hills, and services within the park are limited. Many riders plan to camp at one of the park's campgrounds, taking time to hike the trails and absorb the scenery that makes this coast unforgettable.`,
    },
  ],
  '8146218691529274761': [
    {
      title: 'The Century Ride: A Cycling Milestone',
      content:
        `A "century" in cycling refers to riding 100 miles (161 kilometers) in a single day—a significant milestone that separates casual riders from serious cyclists. The term originated in the early days of organized cycling, when completing such a distance was a notable achievement requiring both fitness and determination.

For recreational cyclists, the first century is often a goal that requires months of training and careful planning. The physical demands are substantial: maintaining an average speed of 15-20 km/h while covering such distance requires sustained energy output over 8-10 hours. Nutrition and hydration become critical—bonking (running out of glycogen) can turn a challenging ride into a survival situation.

Loaded bicycle touring adds another dimension of difficulty. Touring cyclists typically carry 15-25 kilograms of gear, and this extra weight increases rolling resistance, affects handling, and makes every climb harder. A century day on a loaded touring bike is roughly equivalent to 120-130 miles on an unloaded road bike in terms of effort.

The Newfoundland terrain makes century rides particularly demanding. Unlike the flat prairies or gentle river valleys that characterize much of cross-country cycling, Newfoundland serves up relentless hills. The total elevation gain over a century can easily exceed 1,500 meters. Add wind (often fierce) and weather (unpredictable), and completing a century becomes as much about mental toughness as physical fitness.`,
    },
  ],
  '1425300287377365690': [
    {
      title: 'The Newfoundland Outport Resettlement Programs',
      content:
        `Between 1954 and 1975, the Newfoundland government implemented a series of resettlement programs that relocated over 28,000 people from approximately 300 isolated coastal communities—known locally as outports—to larger "growth centers." It remains one of the most controversial chapters in Newfoundland history.

The programs emerged from a modernizing vision championed by Premier Joey Smallwood. The argument was straightforward: providing services like electricity, roads, schools, and healthcare to hundreds of tiny, scattered communities was economically impossible. By concentrating the population, the government could deliver modern amenities more efficiently. Many outport residents lacked running water, electricity, and access to medical care. The logic seemed irrefutable.

The reality proved more complicated. Resettlement disrupted communities that had existed for generations, breaking social bonds and separating people from the landscapes and waters that defined their identities. Many relocated families never adjusted to their new homes. The fishing grounds they knew intimately were now distant, and the community knowledge that had sustained them was rendered useless. Mental health problems, alcoholism, and family breakdown followed many transplanted families.

The programs also failed economically in many cases. The growth centers often lacked the employment opportunities that had been promised. Industries established with government subsidies frequently failed within years. Many resettled families found themselves worse off than before—now dependent on welfare in unfamiliar communities, their old skills irrelevant.

Later waves of resettlement, including programs that continue in modified form today, have attempted to learn from these failures. Financial incentives have replaced coercion, and communities must vote to resettle voluntarily. Yet the debate continues: should the government support isolated communities indefinitely, or is relocation sometimes the pragmatic choice? The abandoned houses slowly collapsing in emptied outports offer no easy answers.`,
    },
  ],
  '3183872721223026856': [
    {
      title: 'The Newfoundland Landscape',
      content:
        `Newfoundland's terrain tells the story of ice ages, ancient mountain ranges, and the relentless work of wind and water. The landscape that greets today's travelers—dramatic, often stark, surprisingly diverse—results from geological forces operating over hundreds of millions of years.

The Long Range Mountains running along the western coast are the northernmost extension of the Appalachian chain, which stretches from Alabama to Newfoundland. These ancient mountains, once as tall as the Himalayas, have been worn down by 400 million years of erosion. The glaciers of the last ice age carved deep fjords into their flanks, creating spectacular features like Western Brook Pond and Gros Morne.

The interior of the island is dominated by the boreal forest—a seemingly endless expanse of black spruce and balsam fir that covers approximately 60% of Newfoundland's land area. This forest grows slowly in the harsh climate, and individual trees may be a century old while remaining only a few meters tall. The forest floor is often a spongy carpet of moss, and the dense growth can make off-trail travel nearly impossible.

The barrens—areas of low shrubs, lichens, mosses, and exposed rock—cover much of the highlands and coastal areas. These seemingly desolate landscapes support a surprising diversity of life, including vast caribou herds and, in late summer, the wild berries that Newfoundlanders prize. The term "barrens" is misleading; to those who know them, these areas are rich ecosystems adapted to thin soils, fierce winds, and short growing seasons.

The coastline, stretching over 17,500 kilometers, is one of the longest and most convoluted in the world. Countless bays, inlets, and coves indent the shore, creating the isolated harbors where outport communities took root. This dramatic meeting of land and sea defines the Newfoundland experience for most visitors.`,
    },
  ],
  '3387785513543904515': [
    {
      title: 'Bicycle Touring Cuisine: Eating to Ride',
      content:
        `Long-distance bicycle touring transforms food from pleasure into necessity. Cyclists covering 80-150 kilometers daily burn 4,000-6,000 calories—two to three times normal intake. Managing this caloric deficit becomes one of the central challenges of touring, requiring both planning and opportunism.

The touring cyclist's pantry prioritizes calorie density and shelf stability. Oatmeal provides complex carbohydrates for sustained energy. Peanut butter delivers fat and protein in a package that won't spoil without refrigeration. Pasta offers cheap calories that cook quickly on small camp stoves. These staples form the foundation, supplemented by whatever fresh food can be purchased along the route.

In Newfoundland, the wild landscape offers bonus calories to those willing to pause and forage. Late summer brings an abundance of blueberries, partridgeberries, and the prized bakeapple. These free supplements provide not just nutrition but variety—a welcome change from the monotony of touring food. The brief pauses required for picking also offer rest for tired legs.

The cooking ritual becomes meaningful in ways that seem surprising afterward. After eight hours in the saddle, the simple act of boiling water and preparing a basic meal takes on an almost ceremonial quality. The food tastes better than it has any right to, elevated by hunger and the satisfaction of having earned it. Many touring cyclists look back on camp meals as highlights of their journeys—not for culinary excellence, but for the context that made simple food transcendent.`,
    },
  ],
  '6025855796723337031': [
    {
      title: 'The Burgeo Road and Southwestern Newfoundland',
      content:
        `Southwestern Newfoundland remains one of the most isolated regions on the island, a rugged territory where the road ends and the only access to several communities is by ferry. The Burgeo Road (Route 480) penetrates this wilderness, offering cyclists a glimpse into a Newfoundland that progress has largely bypassed.

Burgeo itself, population around 1,300, sits at the end of 150 kilometers of winding road through some of the loneliest country in eastern North America. The town serves as a regional center for the southwestern coast, providing ferry access to the isolated communities of Ramea and Grey River. Beyond the road's end, several communities remain accessible only by sea.

The region's isolation is both its challenge and its preservation. While other parts of Newfoundland have been transformed by roads and development, southwestern communities retain a character that has largely vanished elsewhere. Traditional skills survive here by necessity. The relationship with the sea remains immediate and essential.

For cyclists, the Burgeo Road presents significant challenges. Services are virtually nonexistent between the Trans-Canada Highway and Burgeo itself. The terrain is demanding, with significant climbs and often fierce headwinds off the Gulf of St. Lawrence. Weather can deteriorate rapidly. Yet those who make the journey find communities unchanged by tourism, landscapes of fierce beauty, and a hospitality that reflects genuine surprise at visitors who arrive on two wheels.`,
    },
  ],
  '6791033527134303750': [
    {
      title: 'The South Coast: Newfoundland\'s Forgotten Shore',
      content:
        `Newfoundland's south coast, stretching from Port aux Basques to the Burin Peninsula, remains one of the least-visited regions of the province. The coastline is rugged, the communities are small, and the infrastructure reflects decades of depopulation. For those who venture here, the rewards are solitude and authenticity.

The coastal communities of the south were built on the inshore fishery—small boats working close to shore for cod, lobster, and crab. When the cod moratorium devastated this fishery in 1992, many communities never recovered. Young people left for jobs elsewhere, and the population aged. Today, several south coast communities are in the final stages of decline.

The roads along this coast are often narrow and winding, following the contours of bays and headlands rather than taking the direct routes that modern highway engineering prefers. Cyclists find these roads challenging but rewarding—less traffic than the Trans-Canada, more connection to the landscape, and glimpses into communities that mainland Canada has largely forgotten.

Ferry services connect several south coast communities that lack road access entirely. These boats—often small, weather-dependent, and running infrequent schedules—maintain a lifeline for residents and offer adventurous travelers access to communities unchanged by road tourism. For cyclists willing to wait for boats and accept uncertainty, these ferries open a Newfoundland that few outsiders ever see.`,
    },
  ],
  '2198099018247338672': [
    {
      title: 'Grand Bruit: End of the Road',
      content:
        `Grand Bruit, whose name derives from the French for "great noise" (referring to a nearby waterfall), represents one of Newfoundland's last roadless communities. Accessible only by ferry from the small town of Burgeo, the village clings to existence at the end of a long chain of isolation—no roads to Burgeo, limited ferry service from there, and a permanent population that had dwindled to single digits by the late 2000s.

The community's history stretches back to the 18th century, when families settled here to fish the rich waters of the south coast. At its peak, Grand Bruit supported several hundred people, with a school, a church, and the full social fabric of an outport community. The children learned to handle boats before they learned to read, and the rhythm of life followed the seasons of the fishery.

The decline was gradual but inexorable. When the coastal boat service that had connected isolated communities was discontinued in favor of roads, Grand Bruit found itself increasingly cut off. Young people left for communities with more opportunity. The school closed when there were no longer enough children to justify it. Each departure made the next more likely.

In 2010, the remaining residents voted to accept a government resettlement offer, making Grand Bruit one of the last communities to do so voluntarily. The decision was agonizing—these families were choosing to abandon generations of history, the graves of ancestors, the only home many had ever known. The empty houses they left behind now slowly collapse into the landscape, monuments to a way of life that could not survive the modern world.`,
    },
    {
      title: 'The Meaning of Resettlement',
      content:
        `To understand why outport resettlement remains emotionally charged in Newfoundland, you must understand what was lost. The outport communities weren't just places—they were complete social worlds, shaped over generations, containing knowledge and traditions that existed nowhere else.

Each outport had its own character, its own stories, its own subtle variations on the common Newfoundland culture. Residents knew every rock and shoal of their home waters, knowledge passed down through generations and impossible to replicate. They knew which slopes caught the earliest spring sun for gardens, where berries grew thickest, how the wind behaved in each season. This intimate relationship with place—what scholars call "traditional ecological knowledge"—was destroyed when communities scattered.

The social bonds were equally irreplaceable. Outport communities operated on networks of mutual obligation that had developed over centuries. People knew exactly who could be relied upon in crisis, whose word was good, how to interpret every gesture and inflection. Resettlement dropped people into unfamiliar communities where these networks didn't exist and had to be rebuilt from scratch—if they could be rebuilt at all.

For many resettled families, the move meant losing their identity. They went from being people of consequence in their home communities—skilled fishermen, respected elders, keepers of knowledge—to being newcomers in places where their skills were irrelevant. The psychological toll was immense, manifesting in depression, alcoholism, and family breakdown that persisted for generations.`,
    },
  ],
  '3612739713248948561': [
    {
      title: 'The Newfoundland Ferry System',
      content:
        `Ferries are the lifeblood of Newfoundland, connecting the island to the mainland and linking isolated communities along the coast. For a province defined by its coastline, marine transportation remains essential despite decades of road building.

Marine Atlantic, the federal Crown corporation, operates the main route between North Sydney, Nova Scotia, and Newfoundland. Two routes serve the island: the shorter crossing to Port aux Basques (6-8 hours) and the longer route to Argentia on the Avalon Peninsula (approximately 14 hours). The Port aux Basques route operates year-round; the Argentia service runs only in summer.

The experience of the crossing varies enormously with weather. The Cabot Strait can be glassy calm, allowing passengers to enjoy the cafeteria, lounges, and observation decks in comfort. It can also be savagely rough—the strait funnels weather systems between the Gulf of St. Lawrence and the Atlantic, creating conditions that test both ships and passengers. Seasickness is common enough that ferry staff keep mops handy.

Provincial ferries serve communities along Newfoundland's coast that remain inaccessible by road. These smaller vessels—connecting places like Burgeo to Ramea, or Fortune to Saint-Pierre—operate on schedules that seem casual to visitors but are carefully adapted to tides, weather, and local conditions. Missing a connection can mean days of waiting, a reality that enforces patience on travelers accustomed to modern transportation's reliability.`,
    },
  ],
  '8104658444878393316': [
    {
      title: 'The Cabot Trail and Cape Breton Highlands',
      content:
        `The Cabot Trail, a 298-kilometer loop around the northern tip of Cape Breton Island, is considered one of the most scenic drives in North America. For cyclists, it's also one of the most challenging—a relentless series of climbs and descents through terrain that rivals anything in eastern North America.

The trail takes its name from John Cabot, the Italian explorer sailing for England who made landfall somewhere in Atlantic Canada in 1497. Whether he actually landed on Cape Breton is debated, but the marketing has stuck. The route was completed in 1932, connecting previously isolated communities and opening the Cape Breton Highlands to tourism.

The highlands themselves are a plateau of ancient rock, deeply carved by rivers and glaciers. The trail climbs to over 450 meters as it crosses this plateau, with grades that regularly exceed 10%. French Mountain and North Mountain, on the western side of the loop, are particularly notorious—long, steep climbs that have humbled many cyclists. The eastern side is gentler but still demanding.

Cape Breton Highlands National Park protects the heart of this landscape. The park offers camping, hiking trails, and the chance to see moose, bears, and bald eagles. For cyclists, the park also means several challenging climbs and the only significant services in the northern part of the trail. Planning food and water carefully is essential; the distances between towns can stretch to 70 kilometers or more.`,
    },
  ],
  '841714894945557135': [
    {
      title: 'The Big Fiddle of Sydney',
      content:
        `The giant fiddle the travelers visited stands at the Sydney Marine Terminal on the waterfront. Standing 60 feet (18 meters) tall, it's the world's largest ceilidh fiddle, unveiled in 2005 as a tribute to Cape Breton's famous Celtic musical heritage. The sculpture was designed by local artist Cyril Chicken and built by the Cape Breton Development Corporation.

The fiddle's enormous scale reflects Cape Breton's outsized reputation in the world of traditional Celtic music. The island has preserved Scottish fiddle traditions more faithfully than Scotland itself, thanks to generations of relative isolation and strong community ties. Musicians from around the world come to Cape Breton to learn the distinctive style—characterized by driving rhythm, intricate ornamentation, and a repertoire passed down through families for generations.

Sydney and North Sydney, though sharing a name and proximity, are distinct towns with different histories. Sydney, the larger of the two, was founded in 1785 and became Cape Breton's industrial heart when the Dominion Steel and Coal Corporation established massive steel mills in 1899. For most of the 20th century, Sydney's economy rose and fell with the fortunes of steel and coal—booming during wars, struggling between them.

North Sydney, by contrast, developed around its natural harbor and its role as a ferry terminus. The Marine Atlantic ferry to Newfoundland has departed from North Sydney since 1898, making the small town a gateway between the island of Cape Breton and the island of Newfoundland. For travelers heading to Newfoundland by any means, North Sydney is the last stop on the mainland—a place of anticipation and departure.`,
    },
  ],
  '3743438617783611214': [
    {
      title: 'Cape Breton Celtic Culture',
      content:
        `Cape Breton Island preserves Celtic traditions—particularly Scottish Gaelic language and music—more vigorously than anywhere else in North America, and arguably better than Scotland itself. This cultural continuity results from both historical circumstance and deliberate effort.

The Scottish presence on Cape Breton dates to the Highland Clearances of the late 18th and 19th centuries, when landlords evicted tenant farmers to make way for sheep. Tens of thousands of Gaelic-speaking Scots emigrated, many settling in Cape Breton where the rugged landscape reminded them of home. The communities they established maintained their language, music, and traditions through generations of relative isolation.

The fiddle became the central instrument of Cape Breton musical culture, played in a style that preserved and developed Scottish traditions. Cape Breton fiddling is characterized by driving rhythm, intricate ornamentation, and a repertoire of strathspeys, reels, and jigs passed down through families. The style remained remarkably consistent through the 20th century, even as Scottish fiddling evolved in different directions.

The cèilidh (pronounced "KAY-lee"), a traditional Gaelic social gathering, remains a living institution in Cape Breton. These informal events—held in community halls, fire stations, and private homes—feature music, step dancing, and storytelling. They're community entertainment in the original sense: participatory, multigenerational, and deeply social. For visitors lucky enough to find one, a Cape Breton cèilidh offers an authentic glimpse into a culture that has maintained its vitality against considerable odds.`,
    },
    {
      title: 'The Acadian Presence',
      content:
        `While Cape Breton's Scottish heritage receives most attention, the island also preserves significant Acadian culture, particularly in communities along its western coast. The Acadian story—of settlement, expulsion, and determined survival—represents one of the most dramatic chapters in Canadian history.

The Acadians were French settlers who established communities in the Maritime provinces beginning in 1604. For 150 years, they developed a distinctive culture adapted to the region's tidal marshlands, which they farmed using an ingenious system of dikes. They maintained careful neutrality between the French and British empires that contested the region.

That neutrality ended in 1755, when British authorities ordered the deportation of the Acadian population. Over the following years, approximately 11,500 Acadians were forcibly removed from their lands and scattered throughout the British colonies and beyond. Many died from disease and starvation during the deportations. Families were deliberately separated. It was, by modern standards, an act of ethnic cleansing.

Some Acadians eventually returned, settling in areas the British considered marginal—including Cape Breton's western coast. The community of Chéticamp, one of the island's largest Acadian centers, maintains French language, Catholic faith, and traditions including the distinctive Acadian rug hooking. The story of deportation and return is commemorated annually on July 28, the anniversary of the deportation order. The Acadian flag, featuring a gold star on the French tricolor, flies throughout these communities.`,
    },
  ],
};

// Find a good hero image from the geotagged photos
const heroImage = '/geotagged/Newfoundland%20and%20Nova%20Scotia%20Trip%20-%202008%20(51%20of%20161).jpeg';

export default async function Home() {
  const postsData = await getPostsData();
  const { posts, chapters, dateRange, totalPosts, totalImages } = postsData;

  // Prepare posts for navigation
  const navPosts = posts.map((p: { id: string; title: string; shortDate: string }) => ({
    id: p.id,
    title: p.title,
    shortDate: p.shortDate,
  }));

  // Collect all video captions from posts
  const allVideoCaptions: { [key: string]: string } = {};
  posts.forEach((post: { videoCaptions?: { [key: string]: string } }) => {
    if (post.videoCaptions) {
      Object.assign(allVideoCaptions, post.videoCaptions);
    }
  });

  // Build global media array for cross-post lightbox navigation
  const { globalMedia, offsets: mediaOffsets } = buildGlobalMediaArray(
    posts,
    imageCaptionsData as { [key: string]: string },
    allVideoCaptions
  );

  return (
    <main>
      <ProgressBar />
      <Navigation posts={navPosts} />

      {/* Hero Section */}
      <Hero
        title="Maritime Biking"
        subtitle="A 900-mile bicycle journey through Nova Scotia and Newfoundland, chasing ferries, foraging berries, and discovering the warmth of Canada's eastern shores."
        dateRange="August 1 — September 13, 2008"
        backgroundImage={heroImage}
      />

      {/* Introduction */}
      <section className="py-20">
        <div className="article-container">
          <p className="text-xl md:text-2xl leading-relaxed text-stone-700 mb-8">
            In the summer of 2008, three friends set out from Connecticut in a
            1983 Mercedes wagon running on vegetable oil. Their mission: bike
            through the Maritime provinces of Canada, from Cape Breton Island
            through Newfoundland and back. This is their story.
          </p>
          <div className="flex gap-8 text-sm text-stone-500 border-t border-stone-200 pt-8">
            <div>
              <span className="block text-3xl font-bold text-stone-900">{totalPosts}</span>
              journal entries
            </div>
            <div>
              <span className="block text-3xl font-bold text-stone-900">{totalImages}</span>
              photographs
            </div>
            <div>
              <span className="block text-3xl font-bold text-stone-900">900+</span>
              miles cycled
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Route Map */}
      <section className="py-12 bg-stone-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-6 text-center">The Route</h2>
          <RouteMap locations={locationData} />
          <p className="text-center text-sm text-stone-500 mt-4">
            Click markers to see photos from each location
          </p>
        </div>
      </section>

      {/* Posts organized by chapter/date */}
      {chapters.map((chapter: { date: string; fullDate: string; posts: Array<{ id: string; title: string; content: string; formattedDate: string; author: string; images: string[]; heroImage?: string | null; videos?: string[]; comments?: Array<{ author: string; date: string; text: string }>; embeddedMap?: { center: [number, number]; zoom: number; title: string } }> }, chapterIdx: number) => (
        <section key={chapterIdx}>
          <ChapterDivider date={chapter.date} />

          {chapter.posts.map((post: { id: string; title: string; content: string; formattedDate: string; author: string; images: string[]; heroImage?: string | null; videos?: string[]; comments?: Array<{ author: string; date: string; text: string }>; embeddedMap?: { center: [number, number]; zoom: number; title: string } }) => (
              <div key={post.id}>
                <Post
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  formattedDate={post.formattedDate}
                  author={post.author}
                  images={post.images}
                  heroImage={post.heroImage}
                  videos={post.videos}
                  imageCaptions={imageCaptionsData as any}
                  imageMatches={imageMatchesData.matches as any}
                  comments={post.comments}
                  embeddedMap={post.embeddedMap}
                  globalMedia={globalMedia}
                  globalMediaOffset={mediaOffsets.get(post.id) || 0}
                />

                {/* Insert context notes if available for this post */}
                {contextNotes[post.id] && (
                  <div className="article-container">
                    {contextNotes[post.id].map((note, noteIdx) => (
                      <AIContextNote
                        key={noteIdx}
                        title={note.title}
                        content={note.content}
                      />
                    ))}
                  </div>
                )}
              </div>
          ))}
        </section>
      ))}

      {/* Footer */}
      <footer className="py-20 bg-stone-900 text-stone-300">
        <div className="article-container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">The End</h2>
          <p className="text-lg mb-8">
            900 miles. Countless berries. One unforgettable summer.
          </p>
          <p className="text-sm text-stone-500">
            Originally published on Blogger, August–September 2008.
            <br />
            Rebuilt with love, 2024.
          </p>
        </div>
      </footer>
    </main>
  );
}
