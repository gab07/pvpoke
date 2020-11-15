// JavaScript Document

var InterfaceMaster = (function () {
    var instance;

    function createInstance() {


        var object = new interfaceObject();

		function interfaceObject(){

			var self = this;
			var gm = GameMaster.getInstance();
			var data;
			var context = "train_rankings";
			var mode = "pokemon";
			var battle = new Battle();
			var csv = '';


			this.init = function(){


				if(! get){
					this.loadRankings("1500","halloween");
				} else{
					this.loadGetData();
				}

				$(".format-select").on("change", selectFormat);
				$(".ranking-categories a").on("click", selectCategory);
				$("body").on("click", ".check", checkBox);

				window.addEventListener('popstate', function(e) {
					get = e.state;
					self.loadGetData();
				});
			};

			// Grabs ranking data from the Game Master

			this.loadRankings = function(league, cup){
				league = parseInt(league);

				$(".train-table tbody").html('');
				$(".loading").show();

				battle.setCP(league);

				/* This timeout allows the interface to display the loading message before
				being thrown into the data loading loop */

				setTimeout(function(){
					gm.loadTrainData(self, league, cup);
				}, 50);

			}

			// Displays the grabbed data. Showoff.

			this.displayRankingData = function(rankings){

				console.log(rankings);

				data = rankings;

				$(".train-table tbody").html('');

				// Initialize csv data

				csv = 'Pokemon,Score,Type 1,Type 2,Attack,Defense,Stamina,Stat Product,Level,Fast Move,Charged Move 1,Charged Move 2\n';


				// Create an element for each ranked Pokemon

				for(var i = 0; i < rankings.performers.length; i++){
					var r = rankings.performers[i];

					// For now, convert species name to a species ID
					var arr = r.pokemon.split(" ");
					var movesetStr = arr[arr.length-1];
					var movesetArr = movesetStr.split(/\+|\//);
					var speciesName = r.pokemon.replace(" " + movesetStr, "");
					var speciesId = speciesName.toLowerCase();

					speciesId = speciesId.replaceAll("(","");
					speciesId = speciesId.replaceAll(")","");
					speciesId = speciesId.replaceAll(" ","_");

					var pokemon = new Pokemon(speciesId, 0, battle);

					console.log(speciesId);

					if(! pokemon.speciesId){
						continue;
					}

					// Create a new row
					var $row = $(".train-table thead tr.hide").clone();
					$row.removeClass("hide");
					$row.attr("data", speciesId);
					$row.find(".sprite-container").attr("type-1", pokemon.types[0]);
					$row.find(".sprite-container").attr("type-2", pokemon.types[0]);

					if(pokemon.types[1] != "none"){
						$row.find(".sprite-container").attr("type-2", pokemon.types[1]);
					}

					$row.find(".number").html("#"+(i+1));
					$row.find(".name").html(speciesName);
					$row.find(".moves").html(r.pokemon.split(" ")[1]);
					$row.find(".individual-score").html(r.individualScore + '%');
					$row.find(".team-score .score").html(r.teamScore);

					if(r.teamScore >= 500){
						$row.find(".team-score .score").addClass("win");
					}

					// Normalize rating so it has more visual effect
					var colorRating = 500 + ((r.teamScore - 500) * 8);

					if(colorRating > 1000){
						colorRating = 1000;
					} else if(colorRating < 0){
						colorRating = 0;
					}

					var color = battle.getRatingColor(colorRating);

					$row.find(".team-score .score").css("background-color", "rgb("+color[0]+","+color[1]+","+color[2]+")");

					$row.find(".usage").html(r.games);

					$(".train-table tbody").append($row);

					continue;

					pokemon.initialize(true);
					pokemon.selectMove("fast", r.moveset[0]);
					pokemon.selectMove("charged", r.moveset[1], 0);

					if(r.moveset.length > 2){
						pokemon.selectMove("charged", r.moveset[2],1);
					} else{
						pokemon.selectMove("charged", "none", 1);
					}

					if(! pokemon.speciesId){
						continue;
					}

					// Get names of of ranking moves

					var moveNameStr = "";

					// Put together the recommended moveset string
					for(var n = 0; n < r.moveset.length; n++){
						if(n == 0){
							for(var j = 0; j < pokemon.fastMovePool.length; j++){
								if(r.moveset[n] == pokemon.fastMovePool[j].moveId){
									moveNameStr += pokemon.fastMovePool[j].displayName;
									break;
								}
							}
						} else{
							for(var j = 0; j < pokemon.chargedMovePool.length; j++){
								if(r.moveset[n] == pokemon.chargedMovePool[j].moveId){
									moveNameStr += pokemon.chargedMovePool[j].displayName;
									break;
								}
							}
						}

						if(n < r.moveset.length - 1){
							moveNameStr += ", "
						}
					}

					// Is this the best way to add HTML content? I'm gonna go with no here. But does it work? Yes!

					var $el = $("<div class=\"rank " + pokemon.types[0] + "\" type-1=\""+pokemon.types[0]+"\" type-2=\""+pokemon.types[1]+"\" data=\""+pokemon.speciesId+"\"><div class=\"expand-label\"></div><div class=\"name-container\"><span class=\"number\">#"+(i+1)+"</span><span class=\"name\">"+pokemon.speciesName+"</span><div class=\"moves\">"+moveNameStr+"</div></div><div class=\"rating-container\"><div class=\"rating\">"+r.score+"</span></div><div class=\"clear\"></div></div><div class=\"details\"></div>");

					if(limitedPokemon.indexOf(pokemon.speciesId) > -1){
						$el.addClass("limited-rank");
					}

					$(".section.white > .rankings-container").append($el);

					csv += pokemon.speciesName+','+r.score+','+pokemon.types[0]+','+pokemon.types[1]+','+(Math.round(pokemon.stats.atk*10)/10)+','+(Math.round(pokemon.stats.def*10)/10)+','+Math.round(pokemon.stats.hp)+','+Math.round(pokemon.stats.atk*pokemon.stats.def*pokemon.stats.hp)+','+pokemon.level+','+pokemon.fastMove.name+','+pokemon.chargedMoves[0].name+','+pokemon.chargedMoves[1].name+'\n';
				}

				$(".loading").hide();
				$(".rank").on("click", selectPokemon);

				// Update download link with new data
				var filename = $(".cup-select option:selected").html() + " Rankings.csv";
				var filedata = '';

				if(context == "custom"){
					filename = "Custom Rankings.csv";
				}

				if (!csv.match(/^data:text\/csv/i)) {
					filedata = [csv];
					filedata = new Blob(filedata, { type: 'text/csv'});
				}

				$(".button.download-csv").attr("href", window.URL.createObjectURL(filedata));
				$(".button.download-csv").attr("download", filename);


				// If search string exists, process it

				if($(".poke-search").val() != ''){
					$(".poke-search").trigger("keyup");
				}


				// If a Pokemon has been selected via URL parameters, jump to it

				if(jumpToPoke){
					var $el = $(".rank[data=\""+jumpToPoke+"\"]")
					$el.trigger("click");

					// Scroll to element

					$("html, body").animate({ scrollTop: $(document).height()-$(window).height() }, 500);
					$(".rankings-container").scrollTop($el.position().top-$(".rankings-container").position().top-20);

					jumpToPoke = false;
				}
			}

			// Given JSON of get parameters, load these settings

			this.loadGetData = function(){

				if(! get){
					return false;
				}

				// Cycle through parameters and set them

				for(var key in get){
					if(get.hasOwnProperty(key)){

						var val = get[key];

						// Process each type of parameter

						switch(key){

							// Don't process default values so data doesn't needlessly reload

							case "cp":
								$(".league-select option[value=\""+val+"\"]").prop("selected","selected");

								break;

							case "cat":
								$(".ranking-categories a").removeClass("selected");
								$(".ranking-categories a[data=\""+val+"\"]").addClass("selected");

								// Set the corresponding scenario

								var scenarioStr = val;

								if(val == "overall"){
									scenarioStr = "leads";
								}

								for(var i = 0; i < scenarios.length; i++){
									if(scenarios[i].slug == scenarioStr){
										scenario = scenarios[i];
									}
								}
								break;

							case "cup":
								$(".cup-select option[value=\""+val+"\"]").prop("selected","selected");

								if($(".format-select option[cup=\""+val+"\"]").length > 0){
									$(".format-select option[cup=\""+val+"\"]").prop("selected","selected");
								} else{
									var cat = $(".cup-select option[value=\""+val+"\"]").attr("cat");
									$(".format-select option[value=\""+cat+"\"]").prop("selected","selected");
									selectFormat();

									$(".cup-select option[value=\""+val+"\"]").prop("selected","selected");
								}

								if(val == "grunt"){
									$(".continentals").removeClass("hide");
								} else{
									$(".continentals").addClass("hide");
								}

								battle.setCup(val);
								break;

							case "p":
								// We have to wait for the data to load before we can jump to a Pokemon, so store this for later
								jumpToPoke = val;
								break;

						}
					}
				}

				// Load data via existing change function

				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var cup = $(".cup-select option:selected").val();

				self.displayRankings(category, cp, cup, null);
			}

			// When the view state changes, push to browser history so it can be navigated forward or back

			this.pushHistoryState = function(cup, cp, category, speciesId){
				if(context == "custom"){
					return false;
				}

				var url = webRoot+"rankings/"+cup+"/"+cp+"/"+category+"/";

				if(speciesId){
					url += speciesId+"/";
				}

				var data = {cup: cup, cp: cp, cat: category, p: speciesId };

				window.history.pushState(data, "Rankings", url);

				// Send Google Analytics pageview

				gtag('config', UA_ID, {page_location: (host+url), page_path: url});
				gtag('event', 'Lookup', {
				  'event_category' : 'Rankings',
				  'event_label' : speciesId
				});
			}

			// Set a context so this interface can add or skip functionality

			this.setContext = function(value){
				context = value;
			}

			// Set a ranking scenario to be displayed

			this.setScenario = function(value){
				scenario = value;
			}

			// Link the custom ranking interface so these two can talk

			this.setCustomRankingInterface = function(obj){
				customRankingInterface = obj;
			}

			// Return a custom group of the top 100 Pokemon

			this.getMetaGroup = function(){
				return metaGroup;
			}

			// Event handler for changing the league select

			function selectLeague(e){
				var cp = $(".league-select option:selected").val();

				if(context != "custom"){
					var category = $(".ranking-categories a.selected").attr("data");
					var cup = $(".cup-select option:selected").val();

					battle.setCup(cup);

					self.displayRankings(category, cp, cup);
					self.pushHistoryState(cup, cp, category, null);
				}

				battle.setCP(cp);
			}

			// Event handler for changing the cup select

			function selectCup(e){
				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var cup = $(".cup-select option:selected").val();

				if(! category){
					category = "overall";
				}

				if(cup == "grunt"){
					$(".continentals").removeClass("hide");
				} else{
					$(".continentals").addClass("hide");
				}

				self.displayRankings(category, cp, cup);
				self.pushHistoryState(cup, cp, category, null);
			}

			// Event handler for changing the format category

			function selectFormat(e){
				var format = $(".format-select option:selected").val();
				var cup = $(".format-select option:selected").attr("cup");

				$(".cup-select option").hide();
				$(".cup-select option[cat=\""+format+"\"]").show();

				if(cup){
					$(".cup-select option[value=\""+cup+"\"]").eq(0).prop("selected", true);
				} else{
					$(".cup-select option[cat=\""+format+"\"]").eq(0).prop("selected", true);
				}

				if((format == "all")||(cup)){
					$(".cup-select").hide();
				} else{
					$(".cup-select").show();
				}

				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				if(! cup){
					cup = $(".cup-select option:selected").val();
				}

				battle.setCup(cup);

				self.displayRankings(category, cp, cup);
				self.pushHistoryState(cup, cp, category, null);

				if(cup == "grunt"){
					$(".continentals").removeClass("hide");
				} else{
					$(".continentals").addClass("hide");
				}

				if(format == "custom"){
					// Redirect to the custom rankings page
					window.location.href = webRoot+'custom-rankings/';
				}
			}

			// Event handler for selecting ranking category

			function selectCategory(e){

				e.preventDefault();

				$(".ranking-categories a").removeClass("selected");

				$(e.target).addClass("selected");

				var cp = $(".league-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var scenarioStr = $(".ranking-categories a.selected").attr("scenario");
				var cup = $(".cup-select option:selected").val();

				$(".description").hide();
				$(".description."+category).show();

				// Set the corresponding scenario

				for(var i = 0; i < scenarios.length; i++){
					if(scenarios[i].slug == scenarioStr){
						scenario = scenarios[i];
						break;
					}
				}

				self.displayRankings(category, cp, cup);

				self.pushHistoryState(cup, cp, category, null);
			}

			// Event handler clicking on a Pokemon item, load detail data

			function selectPokemon(e){

				// Don't collapse when clicking links or the share button

				if(! $(e.target).is(".rank, .rank > .rating-container, .rank > .rating-container *, .rank > .name-container, .rank > .name-container *, .rank > .expand-label")||($(e.target).is("a"))){
					return;
				}

				var cup = $(".cup-select option:selected").val();
				var category = $(".ranking-categories a.selected").attr("data");
				var $rank = $(this).closest(".rank");


				$rank.toggleClass("selected");
				$rank.find(".details").toggleClass("active");

				var index = $(".rankings-container > .rank").index($rank);
				var $details = $(".details").eq(index);

				if($details.html() != ''){
					return;
				}

				var r = data[index];
				var pokemon = new Pokemon(r.speciesId, 0, battle);
				pokemon.initialize(battle.getCP(), "gamemaster");
				pokemon.selectMove("fast", r.moveset[0]);
				pokemon.selectMove("charged", r.moveset[1], 0);

				if(r.moveset.length > 2){
					pokemon.selectMove("charged", r.moveset[2],1);
				} else{
					pokemon.selectMove("charged", "none", 1);
				}

				var pokeMoveStr = pokemon.generateURLMoveStr();

				// If overall, display score for each category

				if(r.scores){
					var categories = ["Lead","Closer","Switch","Charger","Attacker","Consistency"];

					var $section = $("<div class=\"detail-section overall\"></div>");

					for(var i = 0; i < r.scores.length; i++){
						var $item = $("<div class=\"rating-container\"><div class=\"ranking-header\">"+categories[i]+"</div><div class=\"rating\">"+r.scores[i]+"</div></div>");

						$section.append($item);
					}

					$details.append($section);
				}

				if(pokemon.hasTag("mega")){
					$details.append("<div class=\"detail-section\"><b>Mega Evolutions are currently not allowed in GO Battle League. Use this information to help prepare if they are allowed in the future. Don't invest Mega Energy or Elite TM's until you can use these Pokemon.</b></div>");
				}

				// Display move data

				var fastMoves = pokemon.fastMovePool;
				var chargedMoves = pokemon.chargedMovePool;

				for(var j = 0; j < fastMoves.length; j++){
					fastMoves[j].uses = 0;

					for(var n = 0; n < r.moves.fastMoves.length; n++){
						var move = r.moves.fastMoves[n];

						if(move.moveId == fastMoves[j].moveId){
							fastMoves[j].uses = move.uses;
						}
					}
				}

				for(var j = 0; j < chargedMoves.length; j++){
					chargedMoves[j].uses = 0;

					for(var n = 0; n < r.moves.chargedMoves.length; n++){
						var move = r.moves.chargedMoves[n];

						if(move.moveId == chargedMoves[j].moveId){
							chargedMoves[j].uses = move.uses;
						}
					}
				}

				fastMoves.sort((a,b) => (a.uses > b.uses) ? -1 : ((b.uses > a.uses) ? 1 : 0));
				chargedMoves.sort((a,b) => (a.uses > b.uses) ? -1 : ((b.uses > a.uses) ? 1 : 0));

				// Buckle up, this is gonna get messy. This is the main detail HTML.

				$details.append($(".details-template.hide").html());

				// Need to calculate percentages

				var totalFastUses = 0;

				for(var n = 0; n < fastMoves.length; n++){
					totalFastUses += fastMoves[n].uses;
				}

				// Display fast moves

				for(var n = 0; n < fastMoves.length; n++){
					var percentStr = (Math.floor((fastMoves[n].uses / totalFastUses) * 1000) / 10) + "%";
					var displayWidth = (Math.floor((fastMoves[n].uses / totalFastUses) * 1000) / 20);

					if(displayWidth < 14){
						displayWidth = "14%";
					} else{
						displayWidth = displayWidth + "%";
					}

					$details.find(".moveset.fast").append("<div class=\"rank " + fastMoves[n].type + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+fastMoves[n].displayName+"</span></div><div class=\"rating-container\"><div class=\"rating\" style=\"width:"+displayWidth+"\">"+percentStr+"</span></div><div class=\"clear\"></div></div>");
				}

				// Display charged moves

				var totalChargedUses = 0;

				for(var n = 0; n < chargedMoves.length; n++){
					totalChargedUses += chargedMoves[n].uses;
				}

				for(var n = 0; n < chargedMoves.length; n++){
					percentStr = (Math.floor((chargedMoves[n].uses / totalChargedUses) * 1000) / 10) + "%";
					displayWidth = (Math.floor((chargedMoves[n].uses / totalChargedUses) * 1000) / 20);

					if(displayWidth < 14){
						displayWidth = "14%";
					} else{
						displayWidth = displayWidth + "%";
					}

					$details.find(".moveset.charged").append("<div class=\"rank " + chargedMoves[n].type + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+chargedMoves[n].displayName+"</span></div><div class=\"rating-container\"><div class=\"rating\" style=\"width:"+displayWidth+"\">"+percentStr+"</span></div><div class=\"clear\"></div></div>");
				}

				// Display moveset override notice where applicable

				if( (pokemon.fastMove.moveId != fastMoves[0].moveId)
					|| ((pokemon.chargedMoves[0].moveId != chargedMoves[0].moveId)&&(pokemon.chargedMoves[0].moveId != chargedMoves[1].moveId))
				 	|| ((pokemon.chargedMoves[1].moveId != chargedMoves[0].moveId)&&(pokemon.chargedMoves[1].moveId != chargedMoves[1].moveId))){
					$details.find(".detail-section.moveset-override").show();
				}

				// Helper variables for displaying matchups and link URL

				var cp = $(".league-select option:selected").val();

				if(context == "custom"){
					category = context;
				}

				// Display key matchups

				for(var n = 0; n < r.matchups.length; n++){
					var m = r.matchups[n];
					var opponent = new Pokemon(m.opponent, 1, battle);
					opponent.initialize(battle.getCP(), "gamemaster");
					opponent.selectRecommendedMoveset(category);

					var battleLink = host+"battle/"+cp+"/"+pokemon.speciesId+"/"+opponent.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/"+opponent.generateURLMoveStr()+"/";

					// Append energy settings
					battleLink += pokemon.stats.hp + "-" + opponent.stats.hp + "/";

					if(scenario.energy[0] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					battleLink += "-";

					if(scenario.energy[1] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(opponent.fastMove.energyGain * (Math.floor((scenario.energy[1] * 500) / opponent.fastMove.cooldown)), 100);
					}

					battleLink += "/";

					var $item = $("<div class=\"rank " + opponent.types[0] + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+opponent.speciesName+"</span></div><div class=\"rating-container\"><div class=\"rating star\">"+m.rating+"</span></div><a target=\"_blank\" href=\""+battleLink+"\"></a><div class=\"clear\"></div></div>");

					$details.find(".matchups").append($item);
				}

				// Display top counters

				for(var n = 0; n < r.counters.length; n++){
					var c = r.counters[n];
					var opponent = new Pokemon(c.opponent, 1, battle);
					opponent.initialize(battle.getCP(), "gamemaster");
					opponent.selectRecommendedMoveset(category);
					var battleLink = host+"battle/"+cp+"/"+pokemon.speciesId+"/"+opponent.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/"+opponent.generateURLMoveStr()+"/";

					// Append energy settings
					battleLink += pokemon.stats.hp + "-" + opponent.stats.hp + "/";

					if(scenario.energy[0] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					battleLink += "-";

					if(scenario.energy[1] == 0){
						battleLink += "0";
					} else{
						battleLink += Math.min(opponent.fastMove.energyGain * (Math.floor((scenario.energy[1] * 500) / opponent.fastMove.cooldown)), 100);
					}

					var $item = $("<div class=\"rank " + opponent.types[0] + "\"><div class=\"name-container\"><span class=\"number\">#"+(n+1)+"</span><span class=\"name\">"+opponent.speciesName+"</span></div><div class=\"rating-container\"><div class=\"rating star\">"+(1000-c.rating)+"</span></div><a target=\"_blank\" href=\""+battleLink+"\"></a><div class=\"clear\"></div></div>");

					$details.find(".counters").append($item);
				}

				// Display Pokemon's type information

				$details.find(".typing .type").eq(0).addClass(pokemon.types[0]);
				$details.find(".typing .type").eq(0).html(pokemon.types[0]);

				if(pokemon.types[1] != "none"){
					$details.find(".typing .type").eq(1).addClass(pokemon.types[1]);
					$details.find(".typing .type").eq(1).html(pokemon.types[1]);
				} else{
					$details.find(".typing .rating-container").eq(1).hide();
				}

				// Display weaknesses and resistances
				var effectivenessArr = []; // First we need to push the values into a sortable array, the original is key indexed (essentially an object)
				for(var type in pokemon.typeEffectiveness) {
					if (pokemon.typeEffectiveness.hasOwnProperty(type)) {
						effectivenessArr.push({
	 					   type: type,
	 					   val: pokemon.typeEffectiveness[type]
	 				   });
					}
				}

				effectivenessArr.sort((a,b) => (a.val > b.val) ? -1 : ((b.val > a.val) ? 1 : 0));

				for(var i = 0; i < effectivenessArr.length; i++){
					var num = Math.floor(effectivenessArr[i].val * 1000) / 1000;
					if(effectivenessArr[i].val > 1){
						$details.find(".detail-section .weaknesses").append("<div class=\"type "+effectivenessArr[i].type+"\"><div class=\"multiplier\">x"+num+"</div><div>"+effectivenessArr[i].type+"</div></div>");
					}
				}

				for(var i = effectivenessArr.length - 1; i >= 0; i--){
					var num = Math.floor(effectivenessArr[i].val * 1000) / 1000;
					if(effectivenessArr[i].val < 1){
						$details.find(".detail-section .resistances").append("<div class=\"type "+effectivenessArr[i].type+"\"><div class=\"multiplier\">x"+num+"</div><div>"+effectivenessArr[i].type+"</div></div>");
					}
				}

				// Display Pokemon's stat ranges

				var statRanges = {
					atk: {
						min: pokemon.generateIVCombinations("atk", -1, 1)[0].atk,
						max: pokemon.generateIVCombinations("atk", 1, 1)[0].atk,
					},
					def: {
						min: pokemon.generateIVCombinations("def", -1, 1)[0].def,
						max: pokemon.generateIVCombinations("def", 1, 1)[0].def,
					},
					hp: {
						min: pokemon.generateIVCombinations("hp", -1, 1)[0].hp,
						max: pokemon.generateIVCombinations("hp", 1, 1)[0].hp,
					}
				};

				$details.find(".stats .rating").eq(0).html(Math.round(statRanges.atk.min * 10) / 10);
				$details.find(".stats .rating").eq(1).html(Math.round(statRanges.atk.max * 10) / 10);
				$details.find(".stats .rating").eq(2).html(Math.round(statRanges.def.min * 10) / 10);
				$details.find(".stats .rating").eq(3).html(Math.round(statRanges.def.max * 10) / 10);
				$details.find(".stats .rating").eq(4).html(Math.round(statRanges.hp.min * 10) / 10);
				$details.find(".stats .rating").eq(5).html(Math.round(statRanges.hp.max * 10) / 10);

				// Display Pokemon's highest IV's

				var rank1Combo = pokemon.generateIVCombinations("overall", 1, 1)[0];
				$details.find(".stats .rating").eq(6).html("Lvl " + rank1Combo.level + " " + rank1Combo.ivs.atk + "/" + rank1Combo.ivs.def + "/" + rank1Combo.ivs.hp);

				// Show share link
				var cup = $(".cup-select option:selected").val();
				var cupName = $(".cup-select option:selected").html();

				var link = host + "rankings/"+cup+"/"+cp+"/"+category+"/"+pokemon.speciesId+"/";

				$details.find(".share-link input").val(link);

				// Add multi-battle link
				if(context != "custom"){
					var multiBattleLink = host+"battle/multi/"+cp+"/"+cup+"/"+pokemon.speciesId+"/"+scenario.shields[0]+""+scenario.shields[1]+"/"+pokeMoveStr+"/2-1/";

					// Append energy settings
					multiBattleLink += pokemon.stats.hp + "/";

					if(scenario.energy[0] == 0){
						multiBattleLink += "0";
					} else{
						multiBattleLink += Math.min(pokemon.fastMove.energyGain * (Math.floor((scenario.energy[0] * 500) / pokemon.fastMove.cooldown)), 100);
					}

					multiBattleLink += "/";

					$details.find(".detail-section.float").eq(2).before($("<div class=\"multi-battle-link\"><p>See all of <b>" + pokemon.speciesName + "'s</b> matchups:</p><a target=\"_blank\" class=\"button\" href=\""+multiBattleLink+"\">"+pokemon.speciesName+" vs. " + cupName +"</a></div>"));
				} else{
					$details.find(".share-link").remove();
				}


				// Only execute if this was a direct action and not loaded from URL parameters, otherwise pushes infinite states when the user navigates back

				if((get)&&(get.p == pokemon.speciesId)){
					return;
				}

				self.pushHistoryState(cup, cp, category, pokemon.speciesId);
			}

			// Turn checkboxes on and off

			function checkBox(e){
				$(this).toggleClass("on");
				$(this).trigger("stateChange");
			}

			// Toggle the limited Pokemon from the Rankings

			function toggleLimitedPokemon(e){
				for(var i = 0; i < limitedPokemon.length; i++){
					$(".rank[data='"+limitedPokemon[i]+"']").toggleClass("hide");
				}
			}

			// Show or hide Continentals slots

			function toggleContinentalsSlots(e){
				var selectedSlots = [];

				$(".continentals .check").each(function(index, value){
					if($(this).hasClass("on")){
						selectedSlots.push(index);
					}
				});

				var slots = battle.getCup().slots;

				for(var i = 0; i < slots.length; i++){
					if(selectedSlots.indexOf(i) > -1){
						for(var n = 0; n < slots[i].pokemon.length; n++){
							$(".rank[data='"+slots[i].pokemon[n]+"']").removeClass("hide");
						}
					} else{
						for(var n = 0; n < slots[i].pokemon.length; n++){
							$(".rank[data='"+slots[i].pokemon[n]+"']").addClass("hide");
						}
					}
				}

				if(selectedSlots.length == 0){
					$(".rank").removeClass("hide");
				}
			}
		};

        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();
