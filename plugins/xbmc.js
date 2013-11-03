exports.action = function (data, callback, config, SARAH) {
	// Config
var max_items=1000;
var delay_before_control_local=50;
var delay_before_control_distant=500;
var delay_before_control;
var infodebug=true;

	// Retrieve config
    var  api_url;
    config = config.modules.xbmc;
	if ((!config.api_url_xbmc_music)||(!config.api_url_xbmc_video)) {
        return callback({ 'tts': 'Configuration XBMC invalide' });
    }
	if (data.xbmc=='music') 		{ xbmc_api_url=config.api_url_xbmc_music;}
	else if (data.xbmc=='video') 	{ xbmc_api_url=config.api_url_xbmc_video;}
	else  {return callback({ 'tts': 'Choix du XBMC inconnu!'});}

  //console.log (xbmc_api_url.slice(7,18));
	if (xbmc_api_url.slice(7,18)!='127.0.0.1') {delay_before_control=delay_before_control_distant;} else {delay_before_control=delay_before_control_local;}
	
// arrete le scrolling automatique sur une action quelconque	
	if (typeof(SARAH.context.xbmc)!="undefined"){
		if ((data.xbmc=='video') && (data.action!='scrolling_off') && (data.action!='scrolling_on') && (typeof(SARAH.context.xbmc.scrolling)!="undefined"))
			{console.log('plugin xbmc - arrêt scrolling!');delete SARAH.context.xbmc.scrolling;}
	}
	
// Pour donner la position d'une valeur dans un array
Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {if (this[i] == obj) {return (i);}}
	return -1;
}

//création de personnalisation.json
personnalisation_to_json = function (reponse) {
				var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
				var xml = fs.readFileSync(fileXML, 'utf8');
				var dataperso={};
					
			//recherche la personalisation
			// artists
				var regexp = new RegExp('¤PERSOartiste¤[^*]+¤PERSOartiste¤', 'gm');
				zone_perso=xml.match(regexp).toString();
				regexp = RegExp('\<item>.*<tag>', 'gi');
				if (regexp.test(zone_perso)==true) {
					labelperso=zone_perso.match(regexp);
					regexp = RegExp('\".*"', 'gi');
					labelxbmc=zone_perso.match(regexp);
					for (var i=0;i<labelperso.length;i++) {	
						dataperso[labelxbmc[i].slice(1,labelxbmc[i].length-1)]=labelperso[i].slice(6,labelperso[i].length-5)
					}
				}
				
			//recherche la personalisation
			//genres
				var regexp = new RegExp('¤PERSOgenre¤[^*]+¤PERSOgenre¤', 'gm');
				zone_perso=xml.match(regexp).toString();
				regexp = RegExp('\<item>.*<tag>', 'gi');
				if (regexp.test(zone_perso)==true) {
					labelperso=zone_perso.match(regexp);
					regexp = RegExp('\".*"', 'gi');
					labelxbmc=zone_perso.match(regexp);
					for (var i=0;i<labelperso.length;i++) {	
						dataperso[labelxbmc[i].slice(1,labelxbmc[i].length-1)]=labelperso[i].slice(6,labelperso[i].length-5)
					}
				}
				
			//recherche la personalisation
			//films
				var regexp = new RegExp('¤PERSOfilm¤[^*]+¤PERSOfilm¤', 'gm');
				zone_perso=xml.match(regexp).toString();
				regexp = RegExp('\<item>.*<tag>', 'gi');
				if (regexp.test(zone_perso)==true) {
					labelperso=zone_perso.match(regexp);
					regexp = RegExp('\".*"', 'gi');
					id_film=zone_perso.match(regexp);
					params={"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": {}, "id": 1};
					labelxbmc={};
					doAction(params, xbmc_api_url, callback, function(res){
						for (var i=0;i<res.result.movies.length;i++) {
							labelxbmc[res.result.movies[i].movieid]=res.result.movies[i].label.replace(/&/gi, "&amp;");
						}
						for (var i=0;i<id_film.length;i++) {
							dataperso[labelxbmc[id_film[i].slice(1,id_film[i].length-1)]]=labelperso[i].slice(6,labelperso[i].length-5);
						}
						return reponse(dataperso);
					});
				}
				else 
					{return reponse(dataperso);}

			//recherche la personalisation
			// série
				var regexp = new RegExp('¤PERSOseries¤[^*]+¤PERSOseries¤', 'gm');
				zone_perso=xml.match(regexp).toString();
				regexp = RegExp('\<item>.*<tag>', 'gi');
				if (regexp.test(zone_perso)==true) {
					labelperso=zone_perso.match(regexp);
					regexp = RegExp('\".*"', 'gi');
					id_serie=zone_perso.match(regexp);
					params={"jsonrpc":"2.0","method":"VideoLibrary.GetTVShows","params":{"properties":["title"]},"id":1};
					labelxbmc={};
					doAction(params, xbmc_api_url, callback, function(res){
						for (var i=0;i<res.result.tvshows.length;i++) {
							labelxbmc[res.result.tvshows[i].tvshowid]=res.result.tvshows[i].label;
						}
						for (var i=0;i<id_serie.length;i++) {
							//console.log('i:'+i+' dataperso: '+labelperso[i].slice(6,labelperso[i].length-5)+' - label: '+labelxbmc[id_serie[i].slice(1,id_serie[i].length-1)]);
							dataperso[labelxbmc[id_serie[i].slice(1,id_serie[i].length-1)]]=labelperso[i].slice(6,labelperso[i].length-5);
						}
						return reponse(dataperso);
					});
				}
				else 
					{return reponse(dataperso);}
}			

// Fonction pour mise à jour des données du Context puis génération du xml 
function miseajour_context_et_xml() {
	setTimeout(function(){  // délai pour laisser le temps à xbmc de fournir les bonnes valeurs
		navigation_context_info(function(context){
			console.log('plugin xbmc - Mise à jour SARAH.context.xbmc.');
			if (infodebug==true) {console.dir(SARAH.context.xbmc);}				
			navigation_generation_xml_items();
					});
	}, delay_before_control); 
}

	// fonction pour mise à jour des données en fonction du viewmode
	navigation_context_viewmode_info= function (temp_data) {
			//RAZ des données
			if (temp_data.way_normal) {
			delete temp_data.way_normal;
			delete temp_data.way_reverse;
			delete temp_data.way2_normal;
			delete temp_data.way2_reverse;
			delete temp_data.way_options;
			delete temp_data.way_optionsback;
			delete temp_data.first_col;
			delete temp_data.last_col;
			}
			// nouvelles données
			switch (temp_data.viewmode.toLowerCase()) {								// Définis les vériables propre à l'affichage
				case 'galerie d\'affiches':
				case 'fanart':
					temp_data.way_normal='right';					// Sens pour navigation en auto (liste horiz/vert)
					temp_data.way_reverse='left';					
					temp_data.way2_normal='';					// Sens pour navigation en auto (tableau)
					temp_data.way2_reverse='';					
					temp_data.way_options='up';					
					temp_data.way_optionsback ='right';
					temp_data.first_col=1;							// 1ère Colonne
					temp_data.last_col=1;							// dernière Colonne	
					break;
				case 'informations du média 2':
				case 'informations du média':
				case 'informations du média 3':
				case 'liste':
				case 'info':
				case 'grande liste':
					temp_data.way_normal='down';
					temp_data.way_reverse='up';					
					temp_data.way2_normal='';					
					temp_data.way2_reverse='';					
					temp_data.way_options='left';					
					temp_data.way_optionsback ='right';
					temp_data.first_col=1;
					temp_data.last_col=1;
					break;
				case 'info 2': 
				case 'large':  //   2colonnes
					temp_data.way_normal='down';					
					temp_data.way_reverse='up';					
					temp_data.way2_normal='right';
					temp_data.way2_reverse='left';					
					temp_data.way_options='homeleft';					
					temp_data.way_optionsback ='right';
					temp_data.first_col=1;
					temp_data.last_col=2;
					break;
				case 'vignette': // 5 colonnes
					temp_data.way_normal='down';					
					temp_data.way_reverse='up';					
					temp_data.way2_normal='right';
					temp_data.way2_reverse='left';					
					temp_data.way_options='homeleft';					
					temp_data.way_optionsback ='right';
					temp_data.first_col=1;
					temp_data.last_col=5;
					break;
				case '':	   		
					break;
				default: 
					temp_data.way_normal=false;
					console.log('plugin xbmc - demande viewmode '+temp_data.Viewmode+' inconnu');
					break;
				//console.log('fin navigation_context_viewmode_info ');
				}
	}

	// Fonction pour obtenir: mode d'affichage (viewmode), la fenetre en cours (CurrentWindow), le tri, ...
	// la liste complètes des items (sauf: ..) , le nombre d'élément
	navigation_context_info=function (container_info){
		nocallback='';
		reponse={};

		// charge les personnalisation la première fois
		if (typeof(SARAH.context.xbmc)=="undefined") {		
			var file   = 'plugins/xbmc/personnalisation.json';
			var fs = require('fs');		
			if (fs.existsSync(file))
				{reponse.personnalisation = JSON.parse(fs.readFileSync(file,'utf8')); console.log('plugin xbmc - personnalisation.json chargé');}
			else 
				{SARAH.context.xbmc.personnalisation = {};}
		}
		// sinon conserve les personnalisations
		else{
			reponse.personnalisation=SARAH.context.xbmc.personnalisation;
		}
		
		// charge les données de base viewmode, currentwindows
		par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentwindow"]}, "id": 1};
		doAction(par, xbmc_api_url, nocallback, function(res0){
			reponse.currentwindow={'id':res0.result.currentwindow.id , 'name':res0.result.currentwindow.label};
			par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels":["Container.Viewmode","Container.NumItems","Container.SortMethod","System.CurrentWindow","System.CurrentControl"]}, "id":1};
			doAction(par, xbmc_api_url, nocallback, function(res){
				container={};
				if ((res.result["Container.NumItems"]!='')&&(reponse.currentwindow.name!='')) {
					container.nb_items= parseInt(res.result["Container.NumItems"]);
				}
				else {container.nb_items=0;}
				container.sortmethod=res.result['Container.SortMethod'];	// trie
				container.viewmode=res.result['Container.Viewmode'];		// type d'affichage
				navigation_context_viewmode_info(container);
				// affecte les données
				if ((container.nb_items!=0)&&(container.nb_items<=max_items)&&(reponse.currentwindow.name!=''))  {   //limite réelle ?? 500??? 500 ça marche, 800 non!
						//console.log('traitement des items');
						listitem=[];
						for (var i=0;i<=Math.round(container.nb_items/2);i++) {	
							listitem.push("Container.ListItem("+i+").Label");
						}
						par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels": listitem}, "id":1}; //demande les labels (titre/nom/...) de chaque ligne 
						doAction(par, xbmc_api_url, nocallback, function(res){
							temp_item=[];
							temp_item_id=[];
							for(var attributename in res.result){
								//console.log('--'+res.result[attributename]);
								temp_item.push(res.result[attributename]);
								temp_item_id.push(parseInt(attributename.match(/\d+/g).toString()));
							}
							listitem=[];
							for (var i=(Math.round(container.nb_items/2)+1);i<=container.nb_items;i++) {	
								listitem.push("Container.ListItem("+i+").Label");
							}
							par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels": listitem}, "id":1}; //demande les labels (titre/nom/...) de chaque ligne 
							doAction(par, xbmc_api_url, nocallback, function(res2){
								//temp_item=[];
								//temp_item_id=[];
								for(var attributename in res2.result){
									//console.log('--'+res2.result[attributename]);
									temp_item.push(res2.result[attributename]);
									temp_item_id.push(parseInt(attributename.match(/\d+/g).toString()));
								}
								// renumerote les items avec [..]=0 au lieu de CurrentControl=0 
								var item=[];
								var item_id=[];
								var index=0;
								var pos2point=0; 
								if (temp_item.contains("..")>=0) {
									pos2point=temp_item_id[temp_item.contains("..")]; //id actuel de [..] si liste de film,titre...
									}
								for (i=0; i<temp_item_id.length;i++) {
									if ((pos2point+index)<temp_item_id.length) {
										item.push(temp_item[temp_item_id.contains(pos2point+index)]);
									}else{
										item.push(temp_item[temp_item_id.contains(pos2point+index-temp_item_id.length)]);
									}
									item_id.push(index);
									index++;
								}
								// push vers le context 
								container.items=item;
								container.items_id=item_id;
								reponse.container=container;
								SARAH.context.xbmc=reponse;
								return container_info('OK');
							});
						});
				}else {
					console.log('plugin xbmc - items ignoré/aucun! nb_item='+container.nb_items+' , currentwindow.name='+reponse.currentwindow);
					//(container.nb_items!=0)&&(container.nb_items<max_items)&&(reponse.currentwindow.name!='')
					
					reponse.container=container;
					SARAH.context.xbmc=reponse;
					return container_info('OK');
				}	
			});
		});
	}

	
	// génère le fichier XML temporaire à partir de la liste d'items en cours
	navigation_generation_xml_items = function () {
					var personnalisation=SARAH.context.xbmc.personnalisation;
					var container=SARAH.context.xbmc.container;
					datas_xml='<grammar version="1.0" xml:lang="fr-FR" mode="voice" root="ruleLAZYXBMC_temp" xmlns="http://www.w3.org/2001/06/grammar" tag-format="semantics/1.0">\n';
					datas_xml+='<rule id="ruleLAZYXBMC_temp" scope="public">\n';
					datas_xml+='<tag>out.action=new Object(); </tag>\n';
					datas_xml+='<tag>out.action.xbmc="video" </tag>\n';
					datas_xml+='<one-of>\n';	
					for (var i=0;i<container.items.length;i++) {
						if (container.items[i]!='..') {
							datas_xml+='<item>'+sanitizeNumber(container.items[i].replace(/&/gi, " and ").replace(/\* /gi, "").replace(/:/gi, ""))+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
							if (container.sortmethod=='Piste') {
								datas_xml+='<item>Piste '+sanitizeNumber(container.items_id[i].toString())+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
							}
							if (container.sortmethod=='Épisode') {
								if (container.items[i].replace(/&/gi, " and ").match(/\d{1,2}[xXEe]\d\d/gi)) {
									saison_episode=container.items[i].replace(/&/gi, " and ").match(/\d{1,2}[xXEe]\d\d/gi).toString();
									datas_xml+='<item>saison '+sanitizeNumber(saison_episode.replace(/&/gi, " and ").match(/^\d{1,2}/gi).toString())+' épisode '+sanitizeNumber(saison_episode.replace(/&/gi, " and ").match(/\d{1,2}$/gi).toString())+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
									}
									else {
										if (container.items[i].replace(/&/gi, " and ").match(/^\d\d/gi)) {
											datas_xml+='<item>'+sanitizeNumber(container.items[i].replace(/&/gi, " and ").replace(/\* /gi, "").replace(/^\d{1,2}[.]/gi, ""))+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
											datas_xml+='<item>épisode '+sanitizeNumber(container.items[i].replace(/&/gi, " and ").match(/^\d\d/gi).toString())+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
										}
									}
								
							}
							if (personnalisation[container.items[i].replace(/&/gi, "&amp;")]) {
								if (infodebug==true) {console.log ('plugin xbmc - Personalisation: '+container.items[i].replace(/&/gi, "&amp;")+' -> '+personnalisation[container.items[i].replace(/&/gi, "&amp;")]);}
								datas_xml+='<item>'+sanitizeNumber(personnalisation[container.items[i].replace(/&/gi, "&amp;")])+'<tag>out.action.action="chercheitem";out.action.parameters=encodeURIComponent("'+container.items[i].replace(/&/gi, "&amp;")+'");</tag></item>\n';
							}
						}
					}
					datas_xml+='</one-of>\n';	
					datas_xml+='<tag>out.action._attributes.uri="http://127.0.0.1:8080/sarah/xbmc";</tag>\n';
					datas_xml+='</rule>\n';
					datas_xml+='</grammar>\n';
					var fs = require('fs');
					fs.writeFile("plugins/xbmc/lazyxbmc_temp.xml", datas_xml, function(err) {
						if(err) {console.log(err);}
						else {console.log("plugin xbmc - lazyxbmc_temp.xml généré!");}
						//callback();
					}); 
			//console.log('FIN de mise a jour context et xml!!!!');
	
			return;
	}
	
	navigation_cherche_item= function(searchcontrol,callback) {
		par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
		doAction(par, xbmc_api_url, callback, function(res){
			// détermination du currentcontrol
			currentcontrol=res.result.currentcontrol.label;
			lenstr=res.result.currentcontrol.label.length-1;
			if  ((currentcontrol.indexOf("[")==0)&&(currentcontrol.lastIndexOf("]")==lenstr)) {     
				// supression des [ ] (string!) 
				currentcontrol=res.result.currentcontrol.label.slice(1,lenstr);
			}
			// controle si il fait parti de la liste (évite ascenceur/menu laterale)
			if (SARAH.context.xbmc.container.items.contains(currentcontrol)!=-1) {
				// CAS liste verticale ou horizontale
				if (SARAH.context.xbmc.container.last_col==1) {
					positioncurrentcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(currentcontrol)];
					// Détermination nom et id du searchcontrol
					//searchcontrol=data.parameters;
					positionsearchcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(searchcontrol)];
					if (infodebug==true) {console.log('xbmc plugin - recherche:'+currentcontrol+' ('+positioncurrentcontrol+') vers '+searchcontrol+' ('+positionsearchcontrol+')');}
					diffposition=positionsearchcontrol-positioncurrentcontrol;
					if (diffposition<0) {diffposition+=SARAH.context.xbmc.container.nb_items+1}  //search before current // +1 = '..'  
					if (diffposition>=((SARAH.context.xbmc.container.nb_items)/2)) {			// Pour définir si il vaut mieux aller dans un sens ou l'autre
						// sens inverse
						repeter=SARAH.context.xbmc.container.nb_items-diffposition+1;
						searchdirection=SARAH.context.xbmc.container.way_reverse;
					}
					else {
						//sens normal
						repeter=diffposition;
						searchdirection=SARAH.context.xbmc.container.way_normal;
					}
					if (infodebug==true) {console.log('xbmc plugin - sens "'+searchdirection+'" de :'+repeter);}
					// Lance la requète X fois pour naviguer vers la position
					params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": searchdirection}, "id": 1 };
						if (repeter>0)  {
							for (var i=0;i<repeter;i++) {
								doAction(params, xbmc_api_url);
							}
						}
				}
			
				// cas Tableau rangées/colonne
				if (SARAH.context.xbmc.container.last_col>1) {
					nb_col=SARAH.context.xbmc.container.last_col;
					positioncurrentcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(currentcontrol)];
					// Détermination nom et id du searchcontrol
					//searchcontrol=data.parameters;
					positionsearchcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(searchcontrol)];
					if (infodebug==true) {console.log('xbmc plugin - recherche:'+currentcontrol+' ('+positioncurrentcontrol+') vers '+searchcontrol+' ('+positionsearchcontrol+')');}
					// calcul le déplacement entre colonnes 0=aucun, -2=left-left , 1=right,...
					move_to_col=(positionsearchcontrol % nb_col)-(positioncurrentcontrol % nb_col);
					// calcul le deplacement entre rangées 0=aucun, -2=up-up, 1=down
					move_to_row=(Math.ceil((positionsearchcontrol+1)/nb_col))-(Math.ceil((positioncurrentcontrol+1)/nb_col));
					if (infodebug==true) {console.log('xbmc plugin - décalage de '+move_to_col+' colonnes et de '+move_to_row+' rangées.');}
					// en priorité Gauche/Haut/ Bas / droite (pour le cas du dernier élément de la liste qui est à chauche)
					if (move_to_col<0) { 
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way2_reverse}, "id": 1 };
						for (var i=0;i<Math.abs(move_to_col);i++) {doAction(params, xbmc_api_url);}// Lance la requète X fois pour naviguer vers la colonne
					}
					if (move_to_row>0)  {params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_normal}, "id": 1 };}
					if (move_to_row<0)  {params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_reverse}, "id": 1 };}
					if (move_to_row!=0)  {
						for (var i=0;i<Math.abs(move_to_row);i++) {doAction(params, xbmc_api_url);} // Lance la requète X fois pour naviguer vers la rangée
					}
					if (move_to_col>0) {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way2_normal}, "id": 1 };
						for (var i=0;i<Math.abs(move_to_col);i++) {doAction(params, xbmc_api_url);}// Lance la requète X fois pour naviguer vers la colonne
					}
					if (infodebug==true) {console.log('plugin xbmc - position atteinte');}
				}
				if (callback) {callback();}
			}
			else {console.log('plugin xbmc - impossible de rechercher l\'élément pour l\'instant.'); callback({'tts':'Je ne peux pas!'});}
		});	
}	
 		
	switch (data.action) {
        case 'introspect':
            doAction(introspect, xbmc_api_url, callback);
            break;
		case 'xml_artist':
            doXML(xml_artist, xbmc_api_url, callback);
            break;
        case 'xml_genre':
            doXML(xml_genre, xbmc_api_url, callback);
            break;
		case 'xml_serie':
			doXML(xml_serie, xbmc_api_url, callback);
			break;
		case 'xml_channel':
			doXML(xml_channel, xbmc_api_url, callback);
			break;
		case 'xml_film':
			doXML(xml_film, xbmc_api_url, callback);
			break;
		case 'playlist':
            var filter = {"and": []};
            if (data.genre) {
                filter.and.push({"field": "genre", "operator": "contains", "value": data.genre});
            }
            if (data.artist) {
                filter.and.push({"field": "artist", "operator": "contains", "value": data.artist});
            }
            if (data.title) {
                filter.and.push({"field": "title", "operator": "contains", "value": data.title});
            }
            if (data.dictation) {
                var regexp = /sarah\srecherche\s(\w+)/gi
                var match = regexp.exec(data.dictation);
                if (match) {
                    filter = {"or": []};
                    filter.or.push({"field": "title", "operator": "contains", "value": match[1]});
                    filter.or.push({"field": "artist", "operator": "contains", "value": match[1]});
                }
            }
            doPlaylist(filter, xbmc_api_url, callback);
            break;
        case 'artist':
            var filter = {"and": []};
            if (data.artist) {
                filter.and.push({"field": "artist", "operator": "contains", "value": data.artist});
            }
            doPlaylist(filter, xbmc_api_url, callback);
            break;
		case 'tvshowtitle': 
			doPlaylistSerie(data.showid ,xbmc_api_url , callback);
			break;
		case 'film': 
			if ((typeof(data.movieid)!="undefined") && (typeof(data.resume)!="undefined")) {
				readmovie.params.item.movieid=parseInt(data.movieid);
				(data.resume==1) ? readmovie.params.options.resume=true : readmovie.params.options.resume=false ;
				console.dir(readmovie);
				doAction(readmovie, xbmc_api_url, callback);
			}
			else {
				console.log('plugin xbmc - il manque data.movieid ou data.resume');callback();
			}
			break;
		case 'play':
            doAction(play, xbmc_api_url, callback);
            break;
		case 'playvideo':
            doAction(playvideo, xbmc_api_url, callback);
            break;
        case 'next':
            doAction(next, xbmc_api_url, callback);
            break;
        case 'prev':
            doAction(prev, xbmc_api_url, callback);
            break;
        case 'player':
            doAction(player, xbmc_api_url, callback);
            break;
        case 'volup':
            doAction(volup, xbmc_api_url, callback);
            break;
        case 'volmid':
            doAction(volmid, xbmc_api_url, callback);
            break;
        case 'voldown':
            doAction(voldown, xbmc_api_url, callback);
            break;
		case 'Select':
            doAction(Select, xbmc_api_url, callback);
			miseajour_context_et_xml();
            break;
		case 'videolibraryscan':
			console.log('test:'+VideoLibraryScan);
            doAction(VideoLibraryScan, xbmc_api_url, callback);
			break;
		case 'audiolibraryscan':
            doAction(AudioLibraryScan, xbmc_api_url, callback);
			break;
		case 'shuffle':
			if (data.value==1) doAction(shuffle_on, xbmc_api_url, callback);
			if (data.value==0) doAction(shuffle_off, xbmc_api_url, callback);
			break;
		case 'quitxbmc':
			doAction(quitxbmc, xbmc_api_url, callback);
            break;
		case 'shutdownxbmc':
			doAction(shutdownxbmc, xbmc_api_url, callback);
            break;
		case 'ExecuteAction':
			params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": data.value}, "id": 1 };
			if (typeof(data.repeter)=='undefined') {repeter=1; } else {repeter=data.repeter; } // repeter à 1 par défaut.
			//console.log(repeter);
			for (var i=0;i<repeter;i++)
				{
				if (i==0){doAction(params, xbmc_api_url,callback);}else{doAction(params, xbmc_api_url);}
			}
			switch (data.value) {								
				case 'back':
				case 'contextmenu': 
					miseajour_context_et_xml();
					break;
				
			}

			break;

		case 'setvolume':
			
			if (data.value) {
				
				var params = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": parseInt(data.value)}, "id": 1}
				console.log (params);
				doAction(params, xbmc_api_url, callback);
			}
			break;


			
		case 'viewmode':
			
			// Changer de viewmode dans un librairie: changeviewmode(viewmode souhaité, false)
			var index=0;
			var maxindex=15;
			var changeviewmode=function (search_viewmode,viewmode_found, reponse){
				if (index==0) {
					// bouge à gauche ou haut pour faire apparaitre le menu laterale 
					if ((SARAH.context.xbmc.container.way_options=='left')||(SARAH.context.xbmc.container.way_options=='up')) {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_options}, "id": 1 };
						doAction(params, xbmc_api_url, callback);
					}
					// Reviens au début de la liste puis gauche pour faire apparaitre le menu laterale 
					if (SARAH.context.xbmc.container.way_options=='homeleft') {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "firstpage"}, "id": 1 };
						doAction(params, xbmc_api_url, callback);
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "left"}, "id": 1 };
						doAction(params, xbmc_api_url);
					}
					
					setTimeout(function(){index++; return changeviewmode(search_viewmode,false,reponse);},delay_before_control*2);  //delay d'action xbmc distant
				}
				else if ((viewmode_found==false)&&(index!=0)) {
					doAction(Select, xbmc_api_url, callback, function(res){
						setTimeout(function(){  // délai pour laisser le temps au current control de se mettre à jour
								par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
								doAction(par, xbmc_api_url, callback, function(res){
									// mode affichage suivant => affecte le nouvel affichage à Search_viemode
									if (search_viewmode.toLowerCase()=='next') {search_viewmode=res.result.currentcontrol.label.slice(6,res.result.currentcontrol.label.length);}
									// controle le viewmode sélectionné
									if ((res.result.currentcontrol.label.toLowerCase()==('vue : '+search_viewmode.toLowerCase()))||(index>=maxindex))  {return changeviewmode(search_viewmode,true,reponse);} else {return changeviewmode(search_viewmode,false,reponse);} 
								});
							}, delay_before_control); 			// le temps de "pause" est nécessaire sinon xbmc renvois parfois le label précédent, malgré un select effectué!
						index++;
					});
				}
				else if (viewmode_found==true) {
					if (index>=maxindex) {console.log('Plugin xbmc - Viewmode non trouvé!');SARAH.speak('Je n\'ai pas réussi!'); return reponse(false);}
					// mise à jour SARAH.context.xbmc
						delete SARAH.context.xbmc.container.viemode;
						SARAH.context.xbmc.container.viewmode=search_viewmode;
						navigation_context_viewmode_info(SARAH.context.xbmc.container);
					if (SARAH.context.xbmc.container.way_optionsback) {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_optionsback}, "id": 1 };
						doAction(params, xbmc_api_url,callback, function(res){
							return reponse(true);
						});
					}
					else {return reponse(true);}
				}
			}
			if (data.value) {
				//mémorise le currentcontrole pour ensuite le rechercher en cas de passage de plusieurs colonne à liste.
				var previouscurrentcontrol='';
				if (SARAH.context.xbmc.container.way_options=='homeleft') {
					par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
					doAction(par, xbmc_api_url, callback, function(res){
						previouscurrentcontrol=res.result.currentcontrol.label;
						lenstr=res.result.currentcontrol.label.length-1;
						if  ((previouscurrentcontrol.indexOf("[")==0)&&(previouscurrentcontrol.lastIndexOf("]")==lenstr)) {     
							previouscurrentcontrol=res.result.currentcontrol.label.slice(1,lenstr);// suppression des [ ] (string!) 
						}
					});
				}
				changeviewmode( data.value,false, function (reponse) {
					if ((reponse==true)&&(previouscurrentcontrol!='')) {
					//	navigation_cherche_item(previouscurrentcontrol);
					setTimeout(function(){navigation_cherche_item(previouscurrentcontrol);}, delay_before_control);	
					}
				});
			}
			else {console.log('plugin xbmc - viewmode : il manque data.parameters');}
		
			break;

			
		case 'goto_leftmenu':
			// Sélectionne le menu et le bon tri/choix/valeur de ce menu (si xxxxxx : yyy) dans le menu lateral
			var index=0;
			var maxindex=15;

			var goto_leftmenu=function (search_menu,menu_found,tri_found, reponse){
				console.log("-------------------"+index);
				if (index==0) {
					// bouge à gauche ou haut pour faire apparaitre le menu laterale 
					if ((SARAH.context.xbmc.container.way_options=='left')||(SARAH.context.xbmc.container.way_options=='up')) {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_options}, "id": 1 };
						doAction(params, xbmc_api_url, callback);
					}
					// Reviens au début de la liste puis gauche pour faire apparaitre le menu laterale 
					if (SARAH.context.xbmc.container.way_options=='homeleft') {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "firstpage"}, "id": 1 };
						doAction(params, xbmc_api_url, callback);
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "left"}, "id": 1 };
						doAction(params, xbmc_api_url);
					}
					setTimeout(function(){
						par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
						doAction(par, xbmc_api_url, callback, function(res){
							index++;
							// controle le menu sélectionné
								if ((search_menu.indexOf(":"))&&(res.result.currentcontrol.label.indexOf(":"))) {	//case menu with choice:   menu:Order
									if ((res.result.currentcontrol.label.toLowerCase().slice(0,res.result.currentcontrol.label.indexOf(":")))==(search_menu.toLowerCase().slice(0,search_menu.indexOf(":"))))
										{menu_found=true;}     
									if ((res.result.currentcontrol.label.toLowerCase().slice(res.result.currentcontrol.label.indexOf(":")+1,res.result.currentcontrol.label.length))==(search_menu.toLowerCase().slice(search_menu.indexOf(":")+1,search_menu.length)))
										{tri_found=true;}    
									return goto_leftmenu(search_menu,menu_found,tri_found,reponse);	
								}
								else {																				//simple menu
									if ((res.result.currentcontrol.label.toLowerCase().slice(0,search_menu.length)==(search_menu.toLowerCase()))) 
										{ return goto_leftmenu(search_menu,true,true,reponse);}	
									else {return goto_leftmenu(search_menu,false,false,reponse);}
								}
						});		
					},delay_before_control*2);
				}
				else if (((menu_found==false)||(tri_found==false))&&(index>0)) {
					if (menu_found==false) {action=Down;} else {action=Select}	// Down pour trouver le menu puis Select pour trouver la bonne valeur
					doAction(action, xbmc_api_url, callback, function(res){
						setTimeout(function(){  // délai pour laisser le temps au current control de se mettre à jour
							par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
							doAction(par, xbmc_api_url, callback, function(res){
								index++;
								// controle le menu sélectionné
								console.log(res.result.currentcontrol.label);
								console.log(search_menu);
								console.log("--");
								
								if ((search_menu.indexOf(":"))&&(res.result.currentcontrol.label.indexOf(":"))) {  //case menu with choice:   menu:Order
									if ((res.result.currentcontrol.label.toLowerCase().slice(0,res.result.currentcontrol.label.indexOf(":")))==(search_menu.toLowerCase().slice(0,search_menu.indexOf(":"))))
										{menu_found=true;}     
									if ((res.result.currentcontrol.label.toLowerCase().slice(res.result.currentcontrol.label.indexOf(":")+1,res.result.currentcontrol.label.length))==(search_menu.toLowerCase().slice(search_menu.indexOf(":")+1,search_menu.length)))
										{tri_found=true;}
									if (index>=maxindex) {menu_found=true; tri_found=true;}
									return goto_leftmenu(search_menu,menu_found,tri_found,reponse);	
								}
								else {																				//simple menu
									if (((res.result.currentcontrol.label.toLowerCase().slice(0,search_menu.length)==(search_menu.toLowerCase())))||(index>=maxindex)) 
										{ return goto_leftmenu(search_menu,true,true,reponse);}	
									else {return goto_leftmenu(search_menu,false,false,reponse);}
								}
							});
						}, delay_before_control); 			// le temps de "pause" est nécessaire sinon xbmc renvois parfois le label précédent, malgré un select effectué!
							
					});
				}
				else if ((menu_found==true)&&(tri_found==true)) {
					if (index>=maxindex) {console.log('Plugin xbmc - Menu non trouvé!');SARAH.speak('Je n\'ai pas réussi!'); return reponse(false);}
					
					if ((search_menu.toLowerCase().slice(0,search_menu.indexOf(":")))=="vue ") {    // search_menu="Vue :" -> Change Viewmode
						// mise à jour SARAH.context.xbmc
						delete SARAH.context.xbmc.container.viemode;
						SARAH.context.xbmc.container.viewmode=search_menu.slice(search_menu.indexOf(": ")+2,search_menu.length)
						navigation_context_viewmode_info(SARAH.context.xbmc.container);
					}
					
					if (SARAH.context.xbmc.container.way_optionsback) {
						params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_optionsback}, "id": 1 };
						console.log("--> back!");
						doAction(params, xbmc_api_url,callback, function(res){
							
							return reponse(true);
						});
					}
					else {return reponse(true);}
				}
			}
			if (data.value) {
				var previouscurrentcontrol='';
				if (SARAH.context.xbmc.container.way_options=='homeleft') {
					par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
					doAction(par, xbmc_api_url, callback, function(res){
						previouscurrentcontrol=res.result.currentcontrol.label;
						lenstr=res.result.currentcontrol.label.length-1;
						if  ((previouscurrentcontrol.indexOf("[")==0)&&(previouscurrentcontrol.lastIndexOf("]")==lenstr)) {     
							previouscurrentcontrol=res.result.currentcontrol.label.slice(1,lenstr);// suppression des [ ] (string!) 
						}
					});
				}
				goto_leftmenu( data.value,false, false, function (reponse) {
					if (reponse==true) {
						setTimeout(function(){navigation_cherche_item(previouscurrentcontrol);}, delay_before_control);	
						console.log("true");
						
					}
				});
			}
			else {console.log('plugin xbmc - goto_leftmenu : il manque data.parameters');}
		
			break;

			case 'scrolling_on':
			if (typeof(SARAH.context.xbmc.scrolling)!="undefined") {
				console.log('plugin xbmc - fin de scrolling!');
				delete SARAH.context.xbmc.scrolling;
				callback();
				break;
			}
			if ((typeof(data.parameters)=="undefined")||(typeof(data.value)=="undefined")) {console.log('plugin xbmc - paramètres manquants (scrolling)'); callback(); break;}	
			SARAH.context.xbmc.scrolling="ON";
			function doScroll(max,way,delay) {
				if (max<=0) delete SARAH.context.xbmc.scrolling;
				if (SARAH.context.xbmc.scrolling=='ON') {
					//console.log('scroll :'+SARAH.context.xbmc.scrolling+', max: '+max);
					params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_normal}, "id": 1 };
					if (way=='reverse') {params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": SARAH.context.xbmc.container.way_reverse}, "id": 1 };}
					doAction(params, xbmc_api_url);
					setTimeout(function(){doScroll((max-1),way,delay)}, delay);
					}
			}
			// détermination du currentcontrol
			params={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
			doAction(params, xbmc_api_url, callback, function(res){
				currentcontrol=res.result.currentcontrol.label;
				lenstr=res.result.currentcontrol.label.length-1;
				if  ((currentcontrol.indexOf("[")==0)&&(currentcontrol.lastIndexOf("]")==lenstr)) {     
					currentcontrol=res.result.currentcontrol.label.slice(1,lenstr);// suppression des [ ] (string!) 
				}
				// controle si il fait parti de la liste (évite ascenceur/menu laterale)
				if (SARAH.context.xbmc.container.items.contains(currentcontrol)!=-1) {
					positioncurrentcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(currentcontrol)];
					max=Math.ceil((SARAH.context.xbmc.container.nb_items+1)/SARAH.context.xbmc.container.last_col);
					console.log('plugin xbmc - début de scrolling!');
					doScroll(max, data.parameters,data.value);
					callback();
				}
				else
				{
				console.log('plugin xbmc - scrolling impossible!');
				callback({'tts':'Je ne peux pas.'});
				}
			});
			
			break;
		
		case 'scrolling_off':
			if (typeof(SARAH.context.xbmc.scrolling)!="undefined") {
				console.log('plugin xbmc - fin de scrolling!');
				delete SARAH.context.xbmc.scrolling;
			}
			callback();
			break;

		case 'chercheitem':
			 
			if (data.parameters) {
				navigation_cherche_item(data.parameters,callback);
			}
			else {console.log('plugin xbmc - il manque data.parameters');callback();}
			//callback({});
			break;

		case 'personnalisation_to_json':
			personnalisation_to_json( function(reponse) {
				var fs = require('fs');
				fs.writeFile("plugins/xbmc/personnalisation.json", JSON.stringify(reponse), "utf8" );
				delete SARAH.context.xbmc.personnalisation;
				SARAH.context.xbmc.personnalisation=reponse;
				console.dir(SARAH.context.xbmc.personnalisation);
				console.log('plugin xbmc - fichier personnalisation.json crée et context mis à jour');
				callback({'tts':'personnalisation mise à jour'});
			});
			break;


		case 'ActivateWindow':
			if (data.parameters) {
				params={ "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": {"window": data.window , "parameters": [ data.parameters ]}, "id": 1 };
				}
				else
				{
				params={ "jsonrpc": "2.0", "method": "GUI.ActivateWindow", "params": {"window": data.window}, "id": 1 };
				}
			doAction(params, xbmc_api_url, callback);
			miseajour_context_et_xml();
            break;

		case 'radio':
			doRadio(data.radioid, xbmc_api_url, callback);
			break;
			
		case 'tv':
			if (typeof(data.channelid)!="undefined")  
				{dotvid(data.channelid, xbmc_api_url, callback);}
			else if (typeof(data.channelname)!="undefined")  
				{dotv(data.channelname, xbmc_api_url, callback);}
			else {
				console.log('plugin xbmc - il manque data.channelid ou data.channelname');callback();
			}
			break;

		case 'ExecuteAddon':
			if ((data.parameters)&&(data.value)) {
				params={ "jsonrpc": "2.0", "method": "Addons.ExecuteAddon", "params": { "wait": false, "addonid": data.parameters, "params": ["null"]}, "id":0};
				doAction(params, xbmc_api_url, callback);
				setTimeout(function(){miseajour_context_et_xml();}, data.value);	
				}
				else
				{
				console.log('plugin xbmc - il manque data.parameters ou data.value');callback();
				}
			break;

		case 'sendText':
			if (data.dictation){
				if (infodebug==true) {console.log('plugin xbmc - sendtext dictation: '+data.dictation);}
/*				// Clean question
				var regexp = /écris\s(\w+)/gi 
				var match  = regexp.exec(data.dictation);
				var value = "";
				if (match && match.length >= 1){
					value = match[1];
					if (infodebug==true) {console.log('plugin xbmc - sendtext value = ' + value);}
					sendText.params.text = value;
					sendText.params.done = false;
					doAction(sendText, xbmc_api_url, callback);
				}
*/
				value=data.dictation.slice(21,data.dictation.length);
				if (value){
					if (infodebug==true) {console.log('plugin xbmc - sendtext value = ' + value);}
					sendText.params.text = value;
					sendText.params.done = false;
					doAction(sendText, xbmc_api_url, callback);
				}

				else{
					callback({ 'tts' : "Je n'ai pas compris" });
				}
        
			}
			else{
				callback({ 'tts' : "Je n'ai pas pu executer l'action" });
			}
			break;

		case 'analyse_le_contenu':
			miseajour_context_et_xml();
			setTimeout(function(){callback({"tts":"c\'est fait!"});}, delay_before_control);
			//callback();	
			break;
			
		case 'whatIsPlaying':
			doAction(player, xbmc_api_url, callback, function(json){
				if (json.result){
					var currentPlayer = "";
					if (json.result[0].playerid == 0){currentPlayer = audioPlayer;}	else {currentPlayer = videoPlayer;}
					doAction(currentPlayer, xbmc_api_url, callback, function(json){
						var speech = '';
						if (json.result.item.title && json.result.item.title != '')
							speech = json.result.item.title;
						if (json.result.item.artist && json.result.item.artist != '') 
							speech += ', du groupe: ' + json.result.item.artist;
						if (json.result.item.showtitle && json.result.item.showtitle != '')
							speech += ', de la série: ' + json.result.item.showtitle;
						if (json.result.item.season && json.result.item.season != '' && json.result.item.season != -1 && json.result.item.episode && json.result.item.episode != '')
							speech += ', saison ' + json.result.item.season + ', épisode ' + json.result.item.episode;
						if (speech == '')
							speech = "Je n'ai pas trouvé d'information";
						return callback({ 'tts' : speech });
					});
				}
				else {
					return callback({ 'tts' : "Je n'ai pas trouvé d'information" });
				}
			});
			break;

		default:
            callback({});
            break;
    }
}

// -------------------------------------------
//  QUERIES
//  Doc: http://wiki.xbmc.org/index.php?title=JSON-RPC_API
// -------------------------------------------

// Introspect
var introspect = { "jsonrpc": "2.0", "method": "JSONRPC.Introspect", "params": { "filter": { "id": "AudioLibrary.GetSongs", "type": "method" } }, "id": 1 }

// XML Generation
var xml_artist = {"jsonrpc": "2.0", "method": "AudioLibrary.GetArtists", "params": {}, "id": 1}
var xml_genre = {"jsonrpc": "2.0", "method": "AudioLibrary.GetGenres", "params": {}, "id": 1}
var xml_serie={"jsonrpc": "2.0", "method": "VideoLibrary.GetTVShows", "params": {}, "id": 1}
var xml_channel={"id":1,"jsonrpc":"2.0","method":"PVR.GetChannels","params":{"channelgroupid":"alltv","properties":["channel","channeltype","hidden","lastplayed","locked"]}}
var xml_film={"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": {}, "id": 1}

// Toggle play / pause in current player
var play = {"jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0 }, "id": 1};
var player = {"jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1}
var audioPlayer = {"jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "duration", "thumbnail", "file", "fanart", "streamdetails"], "playerid": 0 }, "id": "AudioGetItem"}
var videoPlayer = {"jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "album", "artist", "season", "episode", "duration", "showtitle", "tvshowid", "thumbnail", "file", "fanart", "streamdetails"], "playerid": 1 }, "id": "VideoGetItem"}

// Toggle play / pause in current player video
var playvideo = {"jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 1 }, "id": 1};
var goscreen =  {"jsonrpc": "2.0", "method":"GUI.ShowNotification", "params": {"title":"Message de moi!","message":"Message de Sarah, Il faut sortir les poubelle!","image":"warning"}, "id": 1};

// TELECOMMANDE
var Left={"jsonrpc": "2.0", "method": "Input.Left", "params": {}, "id": 1}
var Right={"jsonrpc": "2.0", "method": "Input.Right", "params": {}, "id": 1}
var Down={"jsonrpc": "2.0", "method": "Input.Down", "params": {}, "id": 1}
var Up=	{"jsonrpc": "2.0", "method": "Input.Up", "params": {}, "id": 1}
var Home={"jsonrpc": "2.0", "method": "Input.Home", "params": {}, "id": 1}
var Select={"jsonrpc": "2.0", "method": "Input.Select", "params": {}, "id": 1}
var Back={"jsonrpc": "2.0", "method": "Input.Back", "params": {}, "id": 1}
var Info={"jsonrpc": "2.0", "method": "Input.Info", "params": {}, "id": 1}
var ContextMenu={"jsonrpc": "2.0", "method": "Input.ContextMenu", "params": {}, "id": 1}
var ShowOSD={"jsonrpc": "2.0", "method": "Input.ShowOSD", "params": {}, "id": 1}

// Library
var VideoLibraryScan={"jsonrpc":"2.0","method":"VideoLibrary.Scan","id":1}
var AudioLibraryScan={"jsonrpc":"2.0","method":"AudioLibrary.Scan","id":1}

// Send text
var sendText = {"jsonrpc":"2.0","method":"Input.SendText", "params": { "text": "", "done": false }, "id":1}

// Previous / Next item in current player
var next = {"jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "next" }, "id": 1}
var prev = {"jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "previous" }, "id": 1}

// n'est plus utile - function setvolum
// Set Volume in current player
//var volup = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 100}, "id": 1}
//var volmid = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 80}, "id": 1}
//var voldown = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 50}, "id": 1}

// Query library
var genres = {"jsonrpc": "2.0", "method": "AudioLibrary.GetGenres", "params": {"properties": ["title"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" }}, "id": "AudioLibrary.GetGenres"}
var albums = {"jsonrpc": "2.0", "method": "AudioLibrary.GetAlbums", "params": {"properties": ["artist", "artistid", "albumlabel", "year", "thumbnail", "genre"], "limits": { "start": 0, "end": 20 }, "sort": { "method": "label", "order": "ascending" }}, "id": "AudioLibrary.GetAlbumsByGenre"}
var songs = {"jsonrpc": "2.0", "method": "AudioLibrary.GetSongs", "params": {"properties": ["title", "genre", "artist", "duration", "album", "track" ], "limits": { "start": 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true } }, "id": "libSongs"}
var saison={"jsonrpc": "2.0", "method": "VideoLibrary.GetSeasons","params": { "tvshowid": 1 ,"properties": ["season", "thumbnail"]}, "id": 1}
var episode = {"jsonrpc": "2.0", "method": "VideoLibrary.GetEpisodes","params": { "tvshowid": 1 , "season": 1 ,"properties": ["title", "firstaired", "playcount", "runtime", "season", "episode", "file", "streamdetails", "lastplayed", "uniqueid"], "limits": { "start" : 0, "end": 25 }, "sort": { "order": "ascending", "method": "track", "ignorearticle": true }}, "id": 1}

// Playlist
var playlist = {"jsonrpc": "2.0", "method": "Playlist.GetItems", "params": { "properties": ["title", "album", "artist", "duration"], "playlistid": 0 }, "id": 1}
var clearlist = {"jsonrpc": "2.0", "id": 0, "method": "Playlist.Clear", "params": {"playlistid": 0}}
var addtolist = {"jsonrpc": "2.0", "id": 1, "method": "Playlist.Add", "params": {"playlistid": 0, "item": {"songid": 10}}}
var runlist = {"jsonrpc": "2.0", "id": 2, "method": "Player.Open", "params": {"item": {"playlistid": 0}}}
var shuffle_on = {"jsonrpc": "2.0", "method": "Player.SetShuffle",  "params": { "playerid": 0 ,"shuffle":true}, "id": 1}
var shuffle_off = {"jsonrpc": "2.0", "method": "Player.SetShuffle",  "params": { "playerid": 0 ,"shuffle":false}, "id": 1}

// Séries
var playserie = {"jsonrpc": "2.0", "method": "Player.Open", "params": { "item": {"file":""} , "options":{ "resume":true } }, "id": 3}

// radio
var xml_radio = '{"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"file":"plugin://plugin.audio.radio_de/station/radioid"}},"id":1}';

// tv
var GetListChannels={"id":1,"jsonrpc":"2.0","method":"PVR.GetChannels","params":{"channelgroupid":"alltv","properties":["channel","channeltype","hidden","lastplayed","locked"]}};
var SetChannel= {"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"channelid":''}}};

// film
var readmovie={ "jsonrpc": "2.0", "method": "Player.Open", "params": { "item": { "movieid": '' }, "options":{ "resume": '' } }, "id": 1 }
					
// xbmc
var quitxbmc = {"jsonrpc":"2.0","method":"Application.Quit","id":"1"};
var shutdownxbmc={"jsonrpc":"2.0","method":"System.Shutdown","id":"1"};

var doRadio = function(radioid, xbmc_api_url, callback) {
  var xml=JSON.parse(xml_radio);
  xml.params.item.file=xml.params.item.file.replace(/radioid/,radioid);
  sendJSONRequest(xbmc_api_url, xml, function(res){
    if (res === false) callback({"tts":"Je n'ai pas réussi à mettre la radio."})
    else callback({})
  });
}

var dotv = function(channelname, xbmc_api_url, callback) {
	var http = require('http');
	doAction(GetListChannels, xbmc_api_url, callback, function(res){
			for ( var i = 0; i < res.result.channels.length; i++ ) {
				var channels = res.result.channels[i];
				var tokens = channels.channel.split(' ');
				var found = true;
				for ( var j = 0; found && j < tokens.length; j++ ) {
					found = new RegExp(tokens[j],'i').test(channelname);
				}
				if (found) {
					dotvid (SetChannel, xbmc_api_url, callback);
					break;
				}
			}
			if (!found) {callback({"tts":"Je n'ai pas trouvé cette chaîne dans xbmc."});}
	});
}

var dotvid = function(channelid, xbmc_api_url, callback) {
	SetChannel.params.item.channelid=parseInt(channelid);
	doAction(SetChannel, xbmc_api_url, function(res){
		if (res === false) callback({"tts":"Je n'ai pas réussi à mettre cette chaine."}) 
		else callback();
	});
}

doPlaylistSerie = function (id, xbmc_api_url, callback){

	var asyncEpisode=function(l_episode,reponse) {
		if (l_episode) {
			//console.log("saison = "+l_episode.season +" episode = "+l_episode.episode + " last view = "+l_episode.lastplayed + " Playcount = "+l_episode.playcount);
			if (l_episode.playcount == 0) { return reponse(l_episode);}	// si épisode non vu => renvois l'episode
			return asyncEpisode(les_episodes.shift(),reponse);// sinon poursuit à l'épisode suivant
		}
		else {return reponse(false);} // tous les épisodes de cette saison ont été vus
	}	
	
	var asyncSaison=function(la_saison,reponse) {
		if (la_saison) {
			episode.params.season=parseInt(la_saison.season);
			// récupération des épisodes
			sendJSONRequest(xbmc_api_url, episode , function(res){
				les_episodes=res.result.episodes
				asyncEpisode(les_episodes.shift(), function (reponse_episode) {
					if (reponse_episode==false) {return  asyncSaison(les_saisons.shift(),reponse);} // si FALSE alors poursuit à la saison suivante
					else {return reponse(reponse_episode);} // renvois l'épisode trouvé
				});
			});
		}
		else {return reponse(false);} // aucun épisode d'aucune série trouvée.
	}
	
	saison.params.tvshowid =  parseInt(id);
	episode.params.tvshowid =  parseInt(id);
	// récupération des saisons
	sendJSONRequest(xbmc_api_url, saison ,function(res){
		les_saisons=res.result.seasons;
		asyncSaison(les_saisons.shift(), function(reponse) {
			if (reponse==false) { callback({'tts':'Tous les épisodes ont été visionnés!'});	}
			else {
				playserie.params.item.file =  reponse.file
				doAction ( playserie , xbmc_api_url );
				callback({'tts':'lecture de l\'épisode '+reponse.episode+' de la saison '+reponse.season+"."});
			}
		});
		
	});
}

var doPlaylist = function (filter, xbmc_api_url, callback) {
    // Apply filter
    songs.params['filter'] = filter;

    // Search songs
    doAction(songs, xbmc_api_url, callback, function (json) {

        // No results
        if (!json.result.songs) {
            callback({ 'tts': "Je n'ai pas trouvé de résultats" })
            return false;
        }

        // Clear playlist
        doAction(clearlist, xbmc_api_url);

        // Iterate
        json.result.songs.forEach(function (song) {
            // console.log(song.title);
            addtolist.params.item.songid = song.songid;
            doAction(addtolist, xbmc_api_url);
        });

        doAction(runlist, xbmc_api_url);
        return true; // call callback
    })
}

var doAction = function (req, xbmc_api_url, callback, hook) {
	//console.dir(req);
	// Send a simple JSON request
    sendJSONRequest(xbmc_api_url, req, function (res) {
		if (!handleJSONResponse(res, callback)) {
            return;
        }

        // Do stuff
        if (hook) {
            try {
                if (!hook(res)) {
                    return;
                }
            } catch (ex) {
                //console.log(res);
            }
        }

        // Otherwise
        if (callback) {
            callback({})
        }
        ;
    });
}

var doXML = function (req, xbmc_api_url, callback, hook) {

    // Send a simple JSON request
    sendJSONRequest(xbmc_api_url, req, function (res) {
        if (res) {
            // Generation XML Artist
            if ((typeof res.result.artists != 'undefined') && (typeof res.result.limits != 'undefined')) {
                var ligneitem = '';
                var lignehtml = '';
                var nberreur = 0;
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤IMPORTartiste¤ -->\n            <item>ARTIST<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤IMPORTartiste¤';
				var regexp = new RegExp('¤IMPORTartiste¤[^*]+¤IMPORTartiste¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('plugin xbmc - Zone génération automatique artiste effacée.')
			// Génère la zone génération automatique sauf si artiste déjà présent
				replace = '¤IMPORTartiste¤ -->\n';
				var present=0;
                res.result.artists.forEach(function (value) {
					try {
						// test si ligne déjà présente  ATTENTION \\( et \\) pour regexp
						lignetest = '<tag>out.action.artist = encodeURIComponent\\("' + value.label.replace(/&/gi, "&amp;") + '"\\)</tag>';
						var regexp = new RegExp(lignetest, 'gm');
						if (xml.match(regexp))
								{
								lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
								present=present+1;
								}
						else {
							lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
							ligneitem = '            <item>' + value.label.replace(/&/gi, "and") + '<tag>out.action.artist = encodeURIComponent("' + value.label.replace(/&/gi, "&amp;").replace(/"/gi, "\\\"") + '")</tag></item>\n';
							replace += (ligneitem);
							}
					} catch(ex) {
						console.log("plugin xbmc - Erreur d\'importation xml avec l\'artiste "+value.label);
						lignehtml += value.label.replace(/&/gi, "&amp;") + ' <====== Erreur - importation impossible <br>';
						nberreur++;
					}	
               });
                var xml = fs.readFileSync(fileXML, 'utf8');
                replace += '            <!-- ¤IMPORTartiste¤';
                var regexp = new RegExp('¤IMPORTartiste¤[^*]+¤IMPORTartiste¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
			    if (nberreur>0) {var texte_erreur=' ( '+nberreur+ ' erreur )';} else {var texte_erreur='';}
			    console.log('plugin xbmc - ' + (res.result.limits.total-present-nberreur) + ' artistes générés dans xbmc.xml ( +'+present+' déjà personnalisés ) '+texte_erreur);
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total-nberreur)+' artistes dans xbmc.xml '+texte_erreur+'<br><br>'+present+' personnalisés:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
            }

            // Generation XML Genre
            else if ((typeof res.result.genres != 'undefined') && (typeof res.result.limits != 'undefined')) {
				var ligneitem = '';
                var lignehtml = '';
                var nberreur = 0;
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤IMPORTgenre¤ -->\n            <item>GENRE<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤IMPORTgenre¤';
				var regexp = new RegExp('¤IMPORTgenre¤[^*]+¤IMPORTgenre¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('plugin xbmc - Zone génération automatique genre effacée.')
			// Génère la zone génération automatique sauf si artiste déjà présent
				replace = '¤IMPORTgenre¤ -->\n';
				var present=0;
                res.result.genres.forEach(function (value) {
					try {
					// test si ligne déjà présente
						lignetest = '<tag>out.action.genre = encodeURIComponent\\("' + value.label.replace(/&/gi, "&amp;") + '"\\)</tag>'
						var regexp = new RegExp(lignetest, 'gm');
						if (xml.match(regexp))
								{
								lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
								present=present+1;
								}
						else {
							lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
							ligneitem = '            <item>' + value.label.replace(/&/gi, " and ") + '<tag>out.action.genre = encodeURIComponent("' + value.label.replace(/&/gi, "&amp;").replace(/"/gi, "\\\"") + '")</tag></item>\n';
							replace += (ligneitem);
							}
					} catch(ex) {
						console.log("plugin xbmc - Erreur d\'importation xml avec le genre "+value.label);
						lignehtml += value.label.replace(/&/gi, "&amp;") + ' <====== Erreur - importation impossible <br>';
						nberreur++;
					}	
                });
                var xml = fs.readFileSync(fileXML, 'utf8');
                replace += '            <!-- ¤IMPORTgenre¤';
                var regexp = new RegExp('¤IMPORTgenre¤[^*]+¤IMPORTgenre¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
			    if (nberreur>0) {var texte_erreur=' ( '+nberreur+ ' erreur )';} else {var texte_erreur='';}
                console.log('plugin xbmc - ' + (res.result.limits.total-present-nberreur) + ' genres générés dans xbmc.xml ( +'+present+' déjà personnalisés ) '+texte_erreur);
				callback({'tts': '<b>Traitement de ' +(res.result.limits.total-nberreur)+' genres dans xbmc.xml '+texte_erreur+'<br><br>'+present+' personnalisés:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
           }

			// Generation XML Series
			else if ((typeof res.result.tvshows != 'undefined') && (typeof res.result.limits != 'undefined')){
                var ligneitem = '';
                var lignehtml = '';
                var nberreur = 0;
               var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤IMPORTseries¤ -->\n            <item>SERIE<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤IMPORTseries¤';
				var regexp = new RegExp('¤IMPORTseries¤[^*]+¤IMPORTseries¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('plugin xbmc - Zone génération automatique série effacée.')
			// Génère la zone génération automatique sauf si série déjà présente
				var replace  = '¤IMPORTseries¤ -->\n'; 	// zone a remplacer
				var present=0;
                res.result.tvshows.forEach(function(value) { //value contient label ou id
					try {
						// test si ligne déjà présente
						lignetest = '<tag>out.action.showid = "'+value.tvshowid+'"</tag>'
						var regexp = new RegExp(lignetest, 'gm');
						if (xml.match(regexp))
								{
								lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
								present=present+1;
								}
						else {
							lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
							ligneitem = '            <item>' + value.label.replace(/&/gi, " and ") + '<tag>out.action.showid = "' + value.tvshowid + '"</tag></item>\n';
							replace += (ligneitem);
							}
					} catch(ex) {
						console.log("plugin xbmc - Erreur d\'importation xml avec la série "+value.label);
						lignehtml += value.label.replace(/&/gi, "&amp;") + ' <====== Erreur - importation impossible <br>';
						nberreur++;
					}	

					});
				var xml = fs.readFileSync(fileXML,'utf8');
				replace += '            <!-- ¤IMPORTseries¤';
				var regexp = new RegExp('¤IMPORTseries¤[^*]+¤IMPORTseries¤', 'gm');
                var xml    = xml.replace(regexp,replace);
				fs.writeFileSync(fileXML, xml, 'utf8');
			    if (nberreur>0) {var texte_erreur=' ( '+nberreur+ ' erreur )';} else {var texte_erreur='';}
 				console.log('plugin xbmc - ' + (res.result.limits.total-present-nberreur) + ' série générées dans xbmc.xml ( +'+present+' déjà personnalisées ) '+texte_erreur);
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total-nberreur)+' séries dans xbmc.xml '+texte_erreur+'<br><br>'+present+' personnalisées:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
			}

            // Generation XML Channel
            else if ((typeof res.result.channels != 'undefined') && (typeof res.result.limits != 'undefined')) {
				var ligneitem = '';
                var lignehtml = '';
                var nberreur = 0;
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤IMPORTchannel¤ -->\n            <item>CHAINE NON DEFINI<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤IMPORTchannel¤';
				var regexp = new RegExp('¤IMPORTchannel¤[^*]+¤IMPORTchannel¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('plugin xbmc - Zone génération automatique channel effacée.')
			// Génère la zone génération automatique sauf si artiste déjà présent
				replace = '¤IMPORTchannel¤ -->\n';
				var present=0;
                res.result.channels.forEach(function (value) {
					try {
					// test si ligne déjà présente
						lignetest = '<tag>out.action.action="tv";out.action.channelid = '+value.channelid+'</tag>';
						var regexp = new RegExp(lignetest, 'gm');
						if (xml.match(regexp))
								{
								lignehtmlpresent += value.channel.replace(/&/gi, "&amp;") + ' (id '+value.channelid+')<br>'
								present=present+1;
								}
						else {
							lignehtml += value.channel.replace(/&/gi, "&amp;") + ' (id '+value.channelid+')<br>'
							ligneitem = '            <item>' + value.channel.replace(/&/gi, " and ") + '<tag>out.action.action="tv";out.action.channelid = '+value.channelid+'</tag></item>\n';
							replace += (ligneitem);
							}
					} catch(ex) {
						console.log("plugin xbmc - Erreur d\'importation xml avec le channel "+value.label);
						lignehtml += value.channel.replace(/&/gi, "&amp;") + ' <====== Erreur - importation impossible <br>';
						nberreur++;
					}	
                });
                var xml = fs.readFileSync(fileXML, 'utf8');
                replace += '            <!-- ¤IMPORTchannel¤';
                var regexp = new RegExp('¤IMPORTchannel¤[^*]+¤IMPORTchannel¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
			    if (nberreur>0) {var texte_erreur=' ( '+nberreur+ ' erreur )';} else {var texte_erreur='';}
                console.log('plugin xbmc - ' + (res.result.limits.total-present-nberreur) + ' channels générés dans xbmc.xml ( +'+present+' déjà personnalisés ) '+texte_erreur);
				callback({'tts': '<b>Traitement de ' +(res.result.limits.total-nberreur)+' channels dans xbmc.xml '+texte_erreur+'<br><br>'+present+' personnalisés:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
           }

			// Generation XML Films 
			else if ((typeof res.result.movies != 'undefined') && (typeof res.result.limits != 'undefined')){
                var ligneitem = '';
                var lignehtml = '';
                var nberreur = 0;
               var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤IMPORTfilm¤ -->\n            <item>FILM NON DEFINI<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤IMPORTfilm¤';
				var regexp = new RegExp('¤IMPORTfilm¤[^*]+¤IMPORTfilm¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('plugin xbmc - Zone génération automatique film effacée.')
			// Génère la zone génération automatique sauf si film déjà présente
				var replace  = '¤IMPORTfilm¤ -->\n'; 	// zone a remplacer
				var present=0;
                res.result.movies.forEach(function(value) { //value contient label ou id
					try {
						// test si ligne déjà présente
						lignetest = '<tag>out.action.movieid = "'+value.movieid+'"</tag>'
						var regexp = new RegExp(lignetest, 'gm');
						if (xml.match(regexp))
								{
								lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
								present=present+1;
								}
						else {
							lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
							ligneitem = '            <item>' + value.label.replace(/&/gi, " and ") + '<tag>out.action.movieid = "' + value.movieid + '"</tag></item>\n';
							replace += (ligneitem);
							}
					} catch(ex) {
						console.log("plugin xbmc - Erreur d\'importation xml avec le film "+value.label);
						lignehtml += value.label.replace(/&/gi, "&amp;") + ' <====== Erreur - importation impossible <br>';
						nberreur++;
					}	

					});
				var xml = fs.readFileSync(fileXML,'utf8');
				replace += '            <!-- ¤IMPORTfilm¤';
				var regexp = new RegExp('¤IMPORTfilm¤[^*]+¤IMPORTfilm¤', 'gm');
                var xml    = xml.replace(regexp,replace);
				fs.writeFileSync(fileXML, xml, 'utf8');
			    if (nberreur>0) {var texte_erreur=' ( '+nberreur+ ' erreur )';} else {var texte_erreur='';}
 				console.log('plugin xbmc - ' + (res.result.limits.total-present-nberreur) + ' série générées dans xbmc.xml ( +'+present+' déjà personnalisées ) '+texte_erreur);
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total-nberreur)+' séries dans xbmc.xml '+texte_erreur+'<br><br>'+present+' personnalisées:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
			}


		   // Otherwise
            else if (callback) {
                callback({'tts': 'Erreur: aucune importation effectuée!'})
            }
            ;
        }
        else {
            callback({'tts': 'Erreur!'})
        }
    });
}
// -------------------------------------------
//  JSON
// -------------------------------------------

var sendJSONRequest = function (url, reqJSON, callback) {
	var request = require('request');
    request({
            'uri': url,
            'method': 'POST',
            'json': reqJSON
        },
        function (err, response, json) {
            if (err || response.statusCode != 200) {
                return callback(false);
            }

            // Log the response
            // console.log(reqJSON);

            // Return the response
            callback(json);
        });
}

// xbmc_api_url
var handleJSONResponse = function (res, callback) {
//console.dir(res);
	
    // Request error
    if (!res) {
        return callback({ 'tts': "Je n'ai pas pu contacter le serveur" });
    }

    // XBMC error
    if (res.error) {
		return callback({ 'tts': "Je n'ai pas pu executer l'action" });
    }

    return true;
} 

function sanitizeNumber(_item) {
    var number = _item.match(/([0-9]+)/g);
    for (var i in number) {
        _item = _item.replace(number[i], num2Letters(number[i]));
    }
    return _item;
}

function num2Letters(number) {
    if (isNaN(number) || number < 0 || 999 < number) {
        return number;
    }
    if (number === 0 || number === '0') {
        return 'zéro';
    }
    var units2Letters = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'],
            tens2Letters = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    var units = number % 10,
            tens = (number % 100 - units) / 10,
            hundreds = (number % 1000 - number % 100) / 100;
    var unitsOut, tensOut, hundredsOut;
    // Traitement des unités
    unitsOut = (units === 1 && tens > 0 && tens !== 8 ? 'et-' : '') + units2Letters[units];
    // Traitement des dizaines
    if (tens === 1 && units > 0) {
        tensOut = units2Letters[10 + units];
        unitsOut = '';
    } else if (tens === 7 || tens === 9) {
        tensOut = tens2Letters[tens] + '-' + (tens === 7 && units === 1 ? 'et-' : '') + units2Letters[10 + units];
        unitsOut = '';
    } else {
        tensOut = tens2Letters[tens];
    }
    tensOut += (units === 0 && tens === 8 ? 's' : '');
    // Traitement des centaines
    hundredsOut = (hundreds > 1 ? units2Letters[hundreds] + '-' : '') + (hundreds > 0 ? 'cent' : '') + (hundreds > 1 && tens == 0 && units == 0 ? 's' : '');
    // Retour du total
    return hundredsOut + (hundredsOut && tensOut ? '-' : '') + tensOut + (hundredsOut && unitsOut || tensOut && unitsOut ? '-' : '') + unitsOut;
}

