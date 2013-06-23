exports.action = function (data, callback, config, SARAH) {
	//console.dir(SARAH);
	//console.log('SARAH context:');
//	if (typeof(SARAH.context.xbmc)!='undefined') {console.dir(SARAH.context.xbmc);} else {console.log('context vide\n');}
	// Retrieve config
    var  api_url;
    config = config.modules.xbmc;
	if ((!config.api_url_xbmc_music)||(!config.api_url_xbmc_video)) {
        return callback({ 'tts': 'Configuration XBMC invalide' });
    }
	if (data.xbmc=='music') 		{ xbmc_api_url=config.api_url_xbmc_music;}
	else if (data.xbmc=='video') 	{ xbmc_api_url=config.api_url_xbmc_video;}
	else  {return callback({ 'tts': 'Choix du XBMC inconnu!'});}
	
// Pour donner la position d'une valeur dans un array
Array.prototype.contains = function(obj) {
	var i = this.length;
	while (i--) {if (this[i] == obj) {return (i);}}
	return false;
}


				// Fonction pour mise à jour des données du Context puis génération du xml 
function miseajour_context_et_xml() {
	navigation_context_info(function(context){
			navigation_generation_xml_items();
			console.dir(SARAH.context.xbmc);
	});
}

// Fonction pour obtenir: mode d'affichage (viewmode), la fenetre en cours (CurrentWindow), le tri, ...
// la liste complètes des items (sauf: ..) , le nombre d'élément
navigation_context_info=function (container_info){
		nocallback='';
		reponse={};

		par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentwindow"]}, "id": 1};
		doAction(par, xbmc_api_url, nocallback, function(res0){
				reponse.currentwindow={'id':res0.result.currentwindow.id , 'name':res0.result.currentwindow.label};
			});
		par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels":["Container.Viewmode","Container.NumItems","Container.SortMethod","System.CurrentWindow","System.CurrentControl"]}, "id":1};
		doAction(par, xbmc_api_url, nocallback, function(res){
			container={};
			if ((res.result["Container.NumItems"]!='')&&(reponse.currentwindow.name!='')) {
				container.nb_items= parseInt(res.result["Container.NumItems"]);
			}
			else {container.nb_items=0;}
			container.sortmethod=res.result['Container.SortMethod'];	// trie
			container.viewmode=res.result['Container.Viewmode'];		// type d'affichage
			switch (container.viewmode) {								// Définis les vériables propre à l'affichage
				case 'Galerie d\'affiches':
				case 'Fanart':
					container.way_normal='right';					// Prochaine action pour naviguer en auto (droite ou bas suivant liste horiz/vert)
					container.way_reverse='left';					
					container.first_col=1;							// 1ère Colonne
					container.last_col=1;							// dernière Colonne	
					break;
				case 'Informations du média 2':
				case 'Informations du média':
				case 'Informations du média 3':
				case 'Liste':
				case 'Info':
				case 'Grande liste':
					container.way_normal='down';
					container.way_reverse='up';					
					container.first_col=1;
					container.last_col=1;
					break;
				case 'Info 2': 
				case 'Large':  //   2colonnes
					container.way_normal='right';
					container.way_reverse='left';					
					container.first_col=1;
					container.last_col=2;
					break;
				case 'Vignette': // 5 colonnes
					container.way_normal='right';
					container.way_reverse='left';					
					container.first_col=1;
					container.last_col=5;
					break;
				case '':	   		
					break;
				default: 
					container.way_normal=false;
					console.log('Container.Viewmode inconnu');
					break;
				}
			//if ((demande_info=='complet')&&(container.nb_items!=0)&&(container.nb_items<500))  {   //limite réelle ?? 500??? 500 ça marche, 800 non!
			if ((container.nb_items!=0)&&(container.nb_items<500)&&(reponse.currentwindow.name!=''))  {   //limite réelle ?? 500??? 500 ça marche, 800 non!
					listitem=[];
					for (var i=0;i<=container.nb_items;i++) {		
						listitem.push("Container.ListItem("+i+").Label");
					}
					par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels": listitem}, "id":1}; //demande les labels (titre/nom/...) de chaque ligne 
					doAction(par, xbmc_api_url, nocallback, function(res){
						item=[];
						item_id=[];
						for(var attributename in res.result){
//							if (res.result[attributename]!='..') {item.push(res.result[attributename]);}
							item.push(res.result[attributename]);
							item_id.push(parseInt(attributename.match(/\d+/g).toString()));
						}
						container.items=item;
						container.items_id=item_id;
						reponse.container=container;
						SARAH.context.xbmc=reponse;
						return container_info(reponse);
					});
			}			else {reponse.container=container;SARAH.context.xbmc=container_info;return container_info(reponse);}	
		});
	}

	
	// génère le fichier XML temporaire à partir de la liste d'items en cours
	navigation_generation_xml_items = function () {

					datas_xml='<grammar version="1.0" xml:lang="fr-FR" mode="voice" root="ruleXBMC_temp" xmlns="http://www.w3.org/2001/06/grammar" tag-format="semantics/1.0">\n';
					datas_xml+='<rule id="ruleXBMC_temp" scope="public">\n';
					datas_xml+='<tag>out.action=new Object(); </tag>\n';
					datas_xml+='<tag>out.action.xbmc="video" </tag>\n';
					datas_xml+='<one-of>\n';	
					for (var i=0;i<SARAH.context.xbmc.container.items.length;i++) {
						if (SARAH.context.xbmc.container.items[i]!='..') {
							datas_xml+='<item>'+SARAH.context.xbmc.container.items[i].replace(/&/gi, " and ")+'<tag>out.action.action="chercheligne";out.action.parameters="'+SARAH.context.xbmc.container.items[i].replace(/&/gi, "&amp;")+'";</tag></item>\n';
						}
					}
					datas_xml+='</one-of>\n';	
					datas_xml+='<tag>out.action._attributes.uri="http://127.0.0.1:8080/sarah/xbmc";</tag>\n';
					datas_xml+='</rule>\n';
					datas_xml+='</grammar>\n';
					var fs = require('fs');
					fs.writeFile("plugins/xbmc/xbmc_temp.xml", datas_xml, function(err) {
						if(err) {console.log(err);}
						else {console.log("xbmc_temp.xml généré!");}
						//callback();
					}); 
			console.log('FIN de mise a jour context et xml!!!!');
	
			return;
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
			
		case 'hello':
			params={'jsonrpc': '2.0' , 'id': 0,'method': 'Addons.ExecuteAddon','params': {'addonid': 'script.popup','params': {	'line1': 'Hello World' } }};
		doAction(params, xbmc_api_url, callback);
			
			break;
			
			
		case 'ExecuteAction':
			params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": data.value}, "id": 1 };
			if (typeof(data.repeter)=='undefined') {repeter=1; } else {repeter=data.repeter; } // repeter à 1 par défaut.
			//console.log(repeter);
			for (var i=0;i<repeter;i++)
				{
				if (i==0){doAction(params, xbmc_api_url, callback);}else{doAction(params, xbmc_api_url);}
			}
			switch (data.value) {								
				case 'back': miseajour_context_et_xml();
				break
			}

			break;
			
		case 'chercheligne':
			 
			if (data.parameters) {
				par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
				doAction(par, xbmc_api_url, callback, function(res){
					// détermination nom et id du currentcontrol
					currentcontrol=res.result.currentcontrol.label;
					lenstr=res.result.currentcontrol.label.length-1;
					if  ((currentcontrol.indexOf("[")==0)&&(currentcontrol.lastIndexOf("]")==lenstr)) {     
						// supression des [ ] (string!) 
						currentcontrol=res.result.currentcontrol.label.slice(1,lenstr);
					}
					positioncurrentcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(currentcontrol)];
					console.log('Current control:'+currentcontrol+' - position :'+positioncurrentcontrol);
					// Détermination nom et id du searchcontrol
					searchcontrol=data.parameters;
					positionsearchcontrol=SARAH.context.xbmc.container.items_id[SARAH.context.xbmc.container.items.contains(searchcontrol)];
					console.log('Search control:'+searchcontrol+' - position :'+positionsearchcontrol);
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
					console.log('sens "'+searchdirection+'" de :'+diffposition);
					// Lance la requète X fois pour naviguer vers la position
					params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": searchdirection}, "id": 1 };
						if (diffposition>0)  {
							for (var i=0;i<repeter;i++) {
								doAction(params, xbmc_api_url);
							}
						}
				});
			}
			else {console.log('il manque data.parameters');}
			callback({});
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
      
    case 'sendText':
  	
      if (data.dictation)
      {
        console.log(data.dictation);
        
        // Clean question
        var regexp = /écris\s(\w+)/gi 
      	var match  = regexp.exec(data.dictation);
        var value = "";
        
        if (match && match.length >= 1){
          value = match[1];
          
          console.log('value = ' + value);
        	sendText.params.text = value;
        	sendText.params.done = false;
        	doAction(sendText, xbmc_api_url, callback);
      	}
        else
        {
          callback({ 'tts' : "Je n'ai pas compris" });
        }
        
      }
      else
      {
        callback({ 'tts' : "Je n'ai pas pu executer l'action" });
    	}
      break;
      
    case 'whatIsPlaying':
				doAction(player, xbmc_api_url, callback, function(json)
         {
           if (json.result)
           {
             var currentPlayer = "";
             if (json.result[0].playerid == 0)
             {
               currentPlayer = audioPlayer;
             }
             else
             {
               currentPlayer = videoPlayer;
             }
             
             doAction(currentPlayer, xbmc_api_url, callback, function(json){
               var speech = '';
               
               if (json.result.item.title && json.result.item.title != '')
               {
                 speech = json.result.item.title;
               }
               
               if (json.result.item.artist && json.result.item.artist != '')
               {
                 speech += ' du groupe, ' + json.result.item.artist;
               }
               
               if (json.result.item.showtitle && json.result.item.showtitle != '')
               {
                 speech += ' de la série, ' + json.result.item.showtitle;
               }
               
               if (json.result.item.season && json.result.item.season != '' && json.result.item.episode && json.result.item.episode != '')
               {
                 speech += ', saison ' + json.result.item.season + ', épisode ' + json.result.item.episode;
               }
               
               if (speech == '') {speech = "Je n'ai pas trouvé d'information"};
               
               return callback({ 'tts' : speech });
             });
           }
           else
           {
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

// Send text
var sendText = {"jsonrpc":"2.0","method":"Input.SendText", "params": { "text": "", "done": false }, "id":1}

// Previous / Next item in current player
var next = {"jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "next" }, "id": 1}
var prev = {"jsonrpc": "2.0", "method": "Player.GoTo", "params": { "playerid": 0, "to": "previous" }, "id": 1}

// Set Volume in current player
var volup = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 100}, "id": 1}
var volmid = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 80}, "id": 1}
var voldown = {"jsonrpc": "2.0", "method": "Application.SetVolume", "params": { "volume": 50}, "id": 1}

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
var shuffle = {"jsonrpc": "2.0", "method": "Player.SetShuffle",  "params": { "playerid": 0 }, "id": 1}

// Séries
var playserie = {"jsonrpc": "2.0", "method": "Player.Open", "params": { "item": {"file":""} , "options":{ "resume":true } }, "id": 3}

// radio
var xml_radio = '{"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"file":"plugin://plugin.audio.radio_de/station/radioid"}},"id":1}';

var doRadio = function(radioid, xbmc_api_url, callback) {
  var xml=JSON.parse(xml_radio);
  xml.params.item.file=xml.params.item.file.replace(/radioid/,radioid);
  sendJSONRequest(xbmc_api_url, xml, function(res){
    if (res === false) callback({"tts":"Je n'ai pas réussi à mettre la radio."})
    else callback({})
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
                console.log(res);
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
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '§ -->\n            <item>ARTIST<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- §';
				var regexp = new RegExp('§[^§]+§', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('XBMC plugin: Zone génération automatique artiste effacée.')
			// Génère la zone génération automatique sauf si artiste déjà présent
				replace = '§ -->\n';
				var present=0;
                res.result.artists.forEach(function (value) {
					// test si ligne déjà présente
					lignetest = '<tag>out.action.artist = "' + value.label.replace(/&/gi, "&amp;") + '"</tag>'
					var regexp = new RegExp(lignetest, 'gm');
					if (xml.match(regexp))
							{
							lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
							present=present+1;
							}
					else {
						lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
						ligneitem = '            <item>' + value.label.replace(/&/gi, "and") + '<tag>out.action.artist = "' + value.label.replace(/&/gi, "&amp;") + '"</tag></item>\n';
						replace += (ligneitem);
						}
                });
                var xml = fs.readFileSync(fileXML, 'utf8');
                replace += '            <!-- §';
                var regexp = new RegExp('§[^§]+§', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
			    console.log('XBMC plugin: ' + (res.result.limits.total-present) + ' artistes générés dans xbmc.xml ( +'+present+' déjà personnalisés )');
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total)+' artistes dans xbmc.xml<br><br>'+present+' personnalisés:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
            }

            // Generation XML Genre
            else if ((typeof res.result.genres != 'undefined') && (typeof res.result.limits != 'undefined')) {
				var ligneitem = '';
                var lignehtml = '';
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '¤ -->\n            <item>GENRE<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- ¤';
				var regexp = new RegExp('¤[^¤]+¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('XBMC plugin: Zone génération automatique genre effacée.')
			// Génère la zone génération automatique sauf si artiste déjà présent
				replace = '¤ -->\n';
				var present=0;
                res.result.genres.forEach(function (value) {
					// test si ligne déjà présente
					lignetest = '<tag>out.action.genre = "' + value.label.replace(/&/gi, "&amp;") + '"</tag>'
					var regexp = new RegExp(lignetest, 'gm');
					if (xml.match(regexp))
							{
							lignehtmlpresent += value.label.replace(/&/gi, "&amp;") + '<br>'
							present=present+1;
							}
					else {
						lignehtml += value.label.replace(/&/gi, "&amp;") + '<br>'
						ligneitem = '            <item>' + value.label.replace(/&/gi, "and") + '<tag>out.action.genre = "' + value.label.replace(/&/gi, "&amp;") + '"</tag></item>\n';
						replace += (ligneitem);
						}
                });
                var xml = fs.readFileSync(fileXML, 'utf8');
                replace += '            <!-- ¤';
                var regexp = new RegExp('¤[^¤]+¤', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
			    console.log('XBMC plugin: ' + (res.result.limits.total-present) + ' genres générés dans xbmc.xml ( +'+present+' déjà personnalisés )');
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total)+' genres dans xbmc.xml<br><br>'+present+' personnalisés:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
           }

			// Generation XML Series
			else if ((typeof res.result.tvshows != 'undefined') && (typeof res.result.limits != 'undefined')){
                var ligneitem = '';
                var lignehtml = '';
                var lignehtmlpresent = '';
                var fs = require('fs');
                var fileXML = 'plugins/xbmc/xbmc.xml';
            //efface la zone génération automatique
				var xml = fs.readFileSync(fileXML, 'utf8');
				var replace = '£ -->\n            <item>SERIE<tag>out.action._attributes.tts = "Le fichier XML n\'a jamais été généré!"</tag></item>\n<!-- £';
				var regexp = new RegExp('£[^£]+£', 'gm');
                var xml = xml.replace(regexp, replace);
                fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('XBMC plugin: Zone génération automatique série effacée.')
			// Génère la zone génération automatique sauf si série déjà présente
				var replace  = '£ -->\n'; 	// zone a remplacer
				var present=0;
                res.result.tvshows.forEach(function(value) { //value contient label ou id
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
						ligneitem = '            <item>' + value.label.replace(/&/gi, "and") + '<tag>out.action.showid = "' + value.tvshowid + '"</tag></item>\n';
						replace += (ligneitem);
						}

					});
				var xml = fs.readFileSync(fileXML,'utf8');
				replace += '            <!-- £';
				//console.log(replace);
				var regexp = new RegExp('£[^£]+£','gm');
				var xml    = xml.replace(regexp,replace);
				//console.log(xml);
				fs.writeFileSync(fileXML, xml, 'utf8');
				console.log('XBMC plugin: ' + (res.result.limits.total-present) + ' série générées dans xbmc.xml ( +'+present+' déjà personnalisées )');
                callback({'tts': '<b>Traitement de ' +(res.result.limits.total)+' séries dans xbmc.xml<br><br>'+present+' personnalisées:</b><br>'+lignehtmlpresent+'<br><b>'+(res.result.limits.total-present)+' Mises à jour:</b><br>' + lignehtml})
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
            // console.log(json);

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

