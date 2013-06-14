SARAH plugin : XBMC
=======================

Plugin pour S.A.R.A.H. (http://encausse.wordpress.com/s-a-r-a-h/) qui permet de piloter XBMC


- Le mode Lazy est désactivé: lazyxbmc.xml est activé en permanence par Sarah pour faciliter les tests.
pour l'activer:
	dans xbmx.xml, supprimer cette mise en commentaire:
	<!--	Désactivation temporaire du LAZY durant essais plugin
			<item>active le mode xbmc
				<tag>out.action._attributes.context = "lazyxbmc.xml"</tag>
				<tag>out.action._attributes.tts = "Mode XBMC activé. Que veux tu ?"</tag>
			</item>
	-->
	
	dans lazyxbmc.xml,
		renommer la rule futurlazyruleXBMC en lazyruleXBMC dans les 2 lignes suivantes:
			<grammar version="1.0" xml:lang="fr-FR" mode="voice" root="futurlazyruleXBMC" xmlns="http://www.w3.org/2001/06/grammar" tag-format="semantics/1.0">
			<rule id="futurlazyruleXBMC" scope="public">

		supprimer cette mise en commentaire:
			<!--	Désactivation temporaire du LAZY durant essais plugin
			<item>
				Merci ça sera tout, SARAH
				<tag>out.action._attributes.context = "default"</tag>
				<tag>out.action._attributes.tts = "mais de rien!"</tag>
			</item>
			-->
