module.exports = {
	// 	Test configuration et connection
	testconfig: function (config,callback) {
		htmlreponse= '####################<br>';
		htmlreponse+='# Compte rendu du test #<br>';
		htmlreponse+='####################<br>';
		// charge les url de config
		configurlmusic=config.api_url_xbmc_music;
		configurlvideo=config.api_url_xbmc_video;
		warning=false;
		// test la structure de l'url
		htmlreponse+='<br>Contrôle des paramètres votre configuration:';

		regexp = RegExp('.*:.*', 'gi');
		if (regexp.test(configurlmusic)!=true) {
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX ERREUR: api_url_xbmc_music n\'a pas un format valide. <--- Configurez le plugin correctement';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config  : '+configurlmusic ;
			callback({'tts': htmlreponse});
			return;
			}
		regexp = RegExp('.*:.*', 'gi');
		if (regexp.test(configurlvideo)!=true) {
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX ERREUR: api_url_xbmc_video n\'a pas un format valide. <--- Configurez le plugin correctement';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config: '+configurlvideo ;
			callback({'tts': htmlreponse});
			return;
			}
		htmlreponse+='</br>&nbsp;&nbsp;&nbsp;|| OK';
		// test le format de l'IP et du port
		regexp = RegExp(/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){2}(\.([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-4])):/);
		htmlreponse+='</br>Analyse des IP:';
		if (regexp.test(configurlmusic)!=true) {
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX ERREUR : la configuration de api_url_xbmc_music ('+configurlmusic+') ne contient pas d\'ip valable! <--- Configurez le plugin correctement';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port (sans "http://") ';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config: '+configurlmusic ;
			callback({'tts': htmlreponse});
			return;
		}
		regexp = RegExp(/^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){2}(\.([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-4])):/);
		if (regexp.test(configurlvideo)!=true) {
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX ERREUR: la configuration de api_url_xbmc_video ('+configurlvideo+') ne contient pas d\'ip valable! <--- Configurez le plugin correctement';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port (sans "http://") ';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config: '+configurlvideo ;
			callback({'tts': htmlreponse});
			return;
		}
		regexp = RegExp(/:([0-9]){1,5}$/);
		if (regexp.test(configurlmusic)!=true) {
			htmlreponse+='</br>ERREUR: la configuration de api_url_xbmc_music ('+configurlmusic+') ne contient pas de port valable! <--- Configurez le plugin correctement)';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port (sans "/jsonrpc") ';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config: '+configurlmusic ;
			callback({'tts': htmlreponse});
			return;
		}
		regexp = RegExp(/:([0-9]){1,5}$/);
		if (regexp.test(configurlvideo)!=true) {
			htmlreponse+='</br>ERREUR: la configuration de api_url_xbmc_video ('+configurlvideo+') ne contient pas de port valable! <--- Configurez le plugin correctement)';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX attendu: IP:port (sans "/jsonrpc") ';
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX votre config: '+configurlvideo ;
			callback({'tts': htmlreponse});
			return;
		}
		htmlreponse+='</br>&nbsp;&nbsp;&nbsp;|| OK';
		var sys = require('sys')
		var exec = require('child_process').exec;
		function puts(error, stdout, stderr) {
			console.log('111');
			regexp = RegExp('perdus = 1', 'gi');
			htmlreponse+="</br>Ping de l\'ip xbmc 'music' :";
			if (regexp.test(stdout)==true) {
				htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Erreur : '+ip+' ne réponds pas au ping <--- bonne IP??';
				callback({'tts': htmlreponse});
				return;
			}
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;|| OK';
			regexp = RegExp('.*:', 'gi');
			result=configurlvideo.match(regexp);
			ip=result[0].toString().slice(0,result[0].length-1);
			exec("ping -n 1 -w 1000 "+ip, puts2);
			//go_port();
			return;
		}
		function puts2(error, stdout, stderr) {
			regexp = RegExp('perdus = 1', 'gi');
			htmlreponse+="</br>Ping de l\'ip xbmc 'video' :";
			if (regexp.test(stdout)==true) {
				htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Erreur : '+ip+' ne réponds pas au ping <--- bonne IP??';
				callback({'tts': htmlreponse});
				return;
			}
			htmlreponse+='</br>&nbsp;&nbsp;&nbsp;|| OK';
			go_port_music();
		}
		function go_port_music() {
			htmlreponse+='</br>Test le port de destination xbmc "music":';
			var request = require('request');
			request({'uri': 'http://'+configurlmusic,'method': 'GET', 'timeout': 5000}, function (err, response) {
				if (err || response.statusCode != 200) {
					htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Erreur: Aucune réponse sur le port '+configurlmusic+' <--- Port Correct?';
					htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Le port doit être celui que vous avez renseigné dans XBMC (serveur WEB)';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| OK';
				htmlreponse+='</br>Analyse du serveur web XBMC sur le port xbmc "music":';
				regexp = RegExp('<title>.*</title>', 'gi');
				if (regexp.test(response.body)==true) {
					result=response.body.match(regexp);
					site=result[0].slice(7,result[0].length-8);
					}
				else {
					site=response.body;
				}
				
				if (site!='XBMC') {
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Erreur: Ce n\'est pas XBMC qui réponds sur ce port! <--- Vous vous trompez de PC donc d\'IP ou alors ce n\'est le bon port?';
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Info :  C\'est "'+site+ '" qui réponds sur ce port! ';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
				go_port_video();
			});
		}
		function go_port_video() {
			htmlreponse+='</br>Test le port de destination xbmc "video":';
			var request = require('request');
			request({'uri': 'http://'+configurlvideo,'method': 'GET', 'timeout': 5000}, function (err, response) {
				if (err || response.statusCode != 200) {
					htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Erreur: Aucune réponse sur le port '+configurlvideo+' <--- Port Correct?';
					htmlreponse+='</br>&nbsp;&nbsp;&nbsp;XX Le port doit être celui que vous avez renseigné dans XBMC (serveur WEB)';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| OK';
				htmlreponse+='</br>Analyse du serveur web XBMC sur le port de xbmc "video":';
				regexp = RegExp('<title>.*</title>', 'gi');
				result=response.body.match(regexp);
				site=result[0].slice(7,result[0].length-8);
				if (site!='XBMC') {
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Erreur: Ce n\'est pas XBMC qui réponds sur ce port! <--- Vous vous trompez de PC donc d\'IP ou alors ce n\'est le bon port?';
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Info :  C\'est "'+site+ '" qui réponds sur ce port! ';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
				go_port_xbmc_music();
			});
		}
		function go_port_xbmc_music() {
			htmlreponse+='</br>Test la réponse de xbmc "music":';
			var request = require('request');
			var rqjson={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentwindow"]}, "id": 1};
			request({'uri': 'http://'+configurlmusic+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 5000}, function (err, response, json) {
				if (err || response.statusCode != 200) {
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Erreur: réponse incorrecte de XBMC <--- Etrange! Version de xbmc?';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| OK';
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| Info: votre XBMC "music" est actuellement sur la fenetre :'+json.result.currentwindow.label;
				go_port_xbmc_video();
			});
		}
		function go_port_xbmc_video() {
			htmlreponse+='</br>Test la réponse de xbmc "video":';
			var request = require('request');
			var rqjson={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["currentwindow"]}, "id": 1};
			request({'uri': 'http://'+configurlvideo+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 5000}, function (err, response, json) {
				if (err || response.statusCode != 200) {
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;XX Erreur: réponse incorrecte de XBMC <--- Etrange! Version de xbmc?';
					callback({'tts': htmlreponse});
					return;
				}
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| OK';
				htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| Info: votre XBMC "video" est actuellement sur la fenetre :'+json.result.currentwindow.label;
				goto_mediathequemusic();
			});
		}
		
		function goto_mediathequemusic() {
			htmlreponse+='</br>Test de la médiathèque de xbmc "music":';
			var request = require('request');
			var rqjson={"jsonrpc": "2.0", "method": "AudioLibrary.GetArtists", "params": {}, "id": 1};
			request({'uri': 'http://'+configurlmusic+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 15000}, function (err, response, json) {
				if (err || response.statusCode != 200) {
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;XX Erreur: réponse incorrecte de XBMC <--- Etrange! pas de médiathèque musicale dans XBMC?";
					callback({'tts': htmlreponse});
					return;
				}
				if (json.result.limits.total==0) {
					warning=true;
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
					htmlreponse+="<br>|| WARNING -Aucun  artiste <--- Il faut ajouter vos titre à la médiathèque de XBMC";
					}
				else {
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| Info:  Nombre d\'artistes :'+json.result.limits.total;
				}
				rqjson={"id":1,"jsonrpc":"2.0","method":"GUI.ShowNotification","params":{"title":"Félicitation!","message":"Sarah communique moi!"}};
				if (configurlvideo!=configurlmusic) request({'uri': 'http://'+configurlmusic+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 5000});
				goto_mediathequevideo(); 
			});
		}

		function goto_mediathequevideo() {
			htmlreponse+='</br>Test de la médiathèque de xbmc "video":';
			var request = require('request');
			var rqjson={"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": {}, "id": 1};
			request({'uri': 'http://'+configurlvideo+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 15000}, function (err, response, json) {
				if (err || response.statusCode != 200) {
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;XX Erreur: réponse incorrecte de XBMC <--- Etrange! pas de film mis en médiathèque?";
					callback({'tts': htmlreponse});
					return;
				}
				if (json.result.limits.total==0) {
					warning=true;
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
					htmlreponse+="<br>|| WARNING -Aucun  film <--- Il faut ajouter vos titre à la médiathèque de XBMC";
					}
				else {
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
					htmlreponse+='<br>&nbsp;&nbsp;&nbsp;|| Info:  Nombre de films :'+json.result.limits.total;
				}
				goto_controletheme();
			});
		}
		function goto_controletheme() {
			htmlreponse+='</br>Controle du theme/skin xbmc "video":';
			var request = require('request');
			var rqjson={"jsonrpc": "2.0", "method": "GUI.GetProperties", "params": { "properties": ["skin"]}, "id": 1};
			request({'uri': 'http://'+configurlvideo+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 5000}, function (err, response, json) {
				if ((json.result.skin.name!='Confluence')&&(json.result.skin.name!='Aeon Nox')) {
					warning=true;
					htmlreponse+="<br>|| WARNING votre thème est "+json.result.skin.name+", ce n'est pas le thème par défaut. Cela peut éventuellement poser problème en 'mode xbmc'";
					htmlreponse+="<br>|| Cela peut éventuellement poser problème en 'mode xbmc'";
					
					}
				else {
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| OK";
					htmlreponse+="<br>&nbsp;&nbsp;&nbsp;|| Info: votre thème est "+json.result.skin.name;
				}
				
				htmlreponse+='</br><br>';
				htmlreponse+='################<br>';
				htmlreponse+='# Tout est correct! #<br>';
				if (warning) htmlreponse+='# Mais Warning! #<br>';
				htmlreponse+='################<br>';
				rqjson={"id":1,"jsonrpc":"2.0","method":"GUI.ShowNotification","params":{"title":"Félicitation!","message":"Sarah communique moi!"}};
				request({'uri': 'http://'+configurlvideo+'/jsonrpc','method': 'POST', 'json' : rqjson , 'timeout': 5000});
				callback({'tts': htmlreponse});
		
			});
		}
		regexp = RegExp('.*:', 'gi');
		result=configurlmusic.match(regexp);
		ip=result[0].toString().slice(0,result[0].length-1);
		exec("ping -n 1 -w 1000 "+ip, puts);
		return;
	}
}

	
	
