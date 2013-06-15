exports.action = function (data, callback, config, SARAH) {

	// Retrieve config
    var  api_url;
    config = config.modules.xbmc;
	if ((!config.api_url_xbmc_music)||(!config.api_url_xbmc_video)) {
        return callback({ 'tts': 'Configuration XBMC invalide' });
    }
	if (data.xbmc=='music') 		{ xbmc_api_url=config.api_url_xbmc_music;}
	else if (data.xbmc=='video') 	{ xbmc_api_url=config.api_url_xbmc_video;}
	else  {return callback({ 'tts': 'Choix du XBMC inconnu!'});}

	// Fonction pour optenir: mode d'affichage (viewmode), la fenetre en cours (CurrentWindow), le tri, ...
	// et si demande_info='complet' la liste complètes des items (sauf: ..) (=> XML? )
	// CurrentWindow='' pour home ou sous-menu
	var navigation_container_info=function (demande_info, callback, container_info){
		nocallback='';
		reponse={};
		par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels":["Container.Viewmode","Container.NumItems","Container.SortMethod","System.CurrentWindow","System.CurrentControl"]}, "id":1};
		doAction(par, xbmc_api_url, callback, function(res){
			if (res.result["Container.NumItems"]!='') {
				reponse.numitems= parseInt(res.result["Container.NumItems"]);
			}
			else {reponse.numitems=0;}
			reponse.CurrentWindow=res.result['System.CurrentWindow'];	
			reponse.sortmethod=res.result['Container.SortMethod'];	// trie
			reponse.viewmode=res.result['Container.Viewmode'];		// type d'affichage
			switch (reponse.viewmode) {								// Définis les vériables propre à l'affichage
				case 'Galerie d\'affiches':
				case 'Fanart':
					reponse.action_suivant='right';					// Prochaine action pour naviguer en auto (droite ou bas suivant liste horiz/vert)
					reponse.first_col=1;							// 1ère Colonne
					reponse.last_col=1;								// dernière Colonne	
					break;
				case 'Informations du média 2':
				case 'Informations du média':
				case 'Informations du média 3':
				case 'Liste':
				case 'Info':
				case 'Grande liste':
					reponse.action_suivant='down';
					reponse.first_col=1;
					reponse.last_col=1;
					break;
				case 'Info 2': 
				case 'Large':  //   2colonnes
					reponse.action_suivant='right';
					reponse.first_col=1;
					reponse.last_col=2;
					break;
				case 'Vignette': // 5 colonnes
					reponse.action_suivant='right';
					reponse.first_col=1;
					reponse.last_col=5;
					break;
				default: 
					reponse.action_suivant=false;
					console.log('Container.Viewmode inconnu');
					break;
				}
			
			if ((demande_info=='complet')&&(reponse.numitems!=0)&&(reponse.numitems<500))  {   //limite réelle ?? 500??? 500 ça marche, 800 non!
					listitem=[];
					for (var i=0;i<=reponse.numitems;i++) {		
						listitem.push("Container.ListItem("+i+").Label");
					}
					par={"jsonrpc":"2.0","method":"XBMC.GetInfoLabels","params": {"labels": listitem}, "id":1}; //demande les labels (titre/nom/...) de chaque ligne 
					doAction(par, xbmc_api_url, nocallback, function(res){
						reponse.item=[];
						for(var attributename in res.result){
							if (res.result[attributename]!='..') {reponse.item.push(res.result[attributename]);}
						}
						return container_info(reponse);
					});
			}
			else {reponse.item=false; return container_info(reponse);}	
		});
	}
		
/* Utilisation	 
	navigation_container_info( 'complet',callback,function(container_info){
		console.log('-+-+-+-+');
		console.dir(container_info);
		console.log('-+-+-+-+');
	});
*/

	// génère le fichier XML temporaire à partir de la liste d'items en cours
	navigation_generation_xml_items = function () {
			navigation_container_info( 'complet', callback, function(config_container){
					datas_xml='<grammar version="1.0" xml:lang="fr-FR" mode="voice" root="ruleXBMC_temp" xmlns="http://www.w3.org/2001/06/grammar" tag-format="semantics/1.0">\n';
					datas_xml+='<rule id="ruleXBMC_temp" scope="public">\n';
					datas_xml+='<tag>out.action=new Object(); </tag>\n';
					datas_xml+='<tag>out.action.xbmc="video" </tag>\n';
					datas_xml+='<one-of>\n';	
					for (var i=0;i<config_container.item.length;i++) {
						datas_xml+='<item>'+config_container.item[i].replace(/&/gi, "&amp;")+'<tag>out.action.action="chercheligne";out.action.parameters="['+config_container.item[i]+']";</tag></item>\n';
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
			});
			return;
	}
/* Utilisation:	 valider/retour/afficher mes musique/...??
//	navigation_generation_xml_items();

	
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
            break;
	
		case 'ExecuteAction':
			params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": data.value}, "id": 1 };
			if (typeof(data.repeter)=='undefined') {repeter=1; } else {repeter=data.repeter; } // repeter à 1 par défaut.
			//console.log(repeter);
			for (var i=0;i<repeter;i++)
				{
				if (i==0){doAction(params, xbmc_api_url, callback);}else{doAction(params, xbmc_api_url);}
			}
			break;

		case 'chercheligne':
			 test=false;
			 index=0;
			
			var lirelabel=function (test){
				if (test==false) {
					index=index+1;
					params={ "jsonrpc": "2.0", "method": "Input.ExecuteAction", "params": {"action": "down"}, "id": 1 };
					doAction(params, xbmc_api_url, callback, function(rs2) {
						//console.dir(rs2);
						par={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentcontrol"]}, "id": 1}
						setTimeout(function(){  
						doAction(par, xbmc_api_url, callback, function(res){
							reponselabel=res.result.currentcontrol.label
							console.log(index+ ' - ' +reponselabel);
							if ((reponselabel==(data.parameters))||(reponselabel=='[..]')||(index>500))  {return lirelabel(true);} else {return lirelabel(false);} // 500= sécurité
																			// les []  viennent dans le résultat pour des titres/artiste mais pour les boutons d'un sous-menu
						});
						}, 2); // le temps de "pause" est nécessaire sinon xbmc renvois parfois le label précédent, malgré un down effectué!
					});
				}
				else {return true;}
			}
			if (data.parameters) {
				lirelabel( false,function (res5) {
							//console.log(res5);
							callback();
				});	
				}
				else
				{
				consol.log('il manque data.parameters');
				callback();
				}
					
					
			
	
			//callback();
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

// Séries
var playserie = {"jsonrpc": "2.0", "method": "Player.Open", "params": { "item": {"file":""} , "options":{ "resume":true } }, "id": 3}


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

