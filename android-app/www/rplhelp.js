const RPL_HELP={
 label:['Scheduled flights','Voos programados','Vuelos programados','Vols programmés','Geplante Flüge','定期便','计划航班','예정 항공편'],
 title:['Where do these flights come from?','De onde vêm estes voos?','¿De dónde proceden estos vuelos?','D’où proviennent ces vols ?','Woher stammen diese Flüge?','これらの便の情報源は？','这些航班信息来自哪里？','이 항공편 정보의 출처는 무엇인가요?'],
 source:[
 'This list uses RPL — Repetitive Flight Plan — published by DECEA/CGNA in Brazil. It includes Brazilian domestic flights and international flights departing from or arriving in Brazil.',
 'Esta lista usa o RPL — Plano de Voo Repetitivo — disponibilizado pelo DECEA/CGNA no Brasil. Inclui voos domésticos brasileiros e voos internacionais que saem ou chegam ao Brasil.',
 'Esta lista utiliza el RPL — Plan de Vuelo Repetitivo — publicado por DECEA/CGNA en Brasil. Incluye vuelos nacionales brasileños y vuelos internacionales que salen de Brasil o llegan a él.',
 'Cette liste utilise les plans de vol répétitifs RPL publiés par le DECEA/CGNA au Brésil. Elle inclut les vols intérieurs brésiliens et les vols internationaux au départ ou à destination du Brésil.',
 'Diese Liste nutzt die von DECEA/CGNA in Brasilien veröffentlichten RPL-Dauerflugpläne. Sie umfasst brasilianische Inlandsflüge sowie internationale Flüge von und nach Brasilien.',
 'この一覧は、ブラジルのDECEA/CGNAが公開するRPL（反復飛行計画）に基づきます。ブラジル国内便と、ブラジルを出発または到着する国際便が対象です。',
 '此列表使用巴西 DECEA/CGNA 发布的 RPL（重复飞行计划），包含巴西国内航班以及从巴西出发或抵达巴西的国际航班。',
 '이 목록은 브라질 DECEA/CGNA가 제공하는 RPL(반복 비행계획)을 사용합니다. 브라질 국내선과 브라질에서 출발하거나 도착하는 국제선이 포함됩니다.'
 ],
 window:[
 'We show departures scheduled between 30 and 90 minutes from now. This list does not cover all scheduled flights worldwide.',
 'Mostramos as partidas previstas entre 30 e 90 minutos a partir de agora. A lista não representa todos os voos programados do mundo.',
 'Se muestran las salidas previstas entre 30 y 90 minutos a partir de ahora. La lista no incluye todos los vuelos programados del mundo.',
 'Les départs affichés sont prévus entre 30 et 90 minutes à partir de maintenant. Cette liste ne couvre pas tous les vols programmés dans le monde.',
 'Angezeigt werden Abflüge in 30 bis 90 Minuten ab jetzt. Die Liste umfasst nicht alle weltweit geplanten Flüge.',
 '現在から30～90分後に出発予定の便を表示します。世界中のすべての定期便を網羅しているわけではありません。',
 '显示从现在起30至90分钟内预计起飞的航班。此列表并不涵盖全球所有计划航班。',
 '현재부터 30~90분 후 출발 예정인 항공편을 표시합니다. 전 세계의 모든 예정 항공편을 포함하지는 않습니다.'
 ],
 free:[
 'To generate a roster from other airports, use Free roster.',
 'Para gerar uma escala em outros aeroportos, use Escala livre.',
 'Para generar una programación desde otros aeropuertos, utiliza Programación libre.',
 'Pour créer un planning depuis d’autres aéroports, utilisez le planning libre.',
 'Für Dienstpläne ab anderen Flughäfen verwenden Sie den freien Dienstplan.',
 'その他の空港からスケジュールを作成するには、自由スケジュールを使用してください。',
 '如需从其他机场生成排班，请使用自由排班。',
 '다른 공항에서 일정을 생성하려면 자유 일정을 사용하세요.'
 ]
};
function rplHelpText(key){return RPL_HELP[key][LANGS.indexOf(lang)]||RPL_HELP[key][0]}
function showRplHelp(){
 openSheet('rpl-help',head('',esc(rplHelpText('title')))+
 ['source','window','free'].map(key=>'<p>'+esc(rplHelpText(key))+'</p>').join(''));
}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-rpl-help]'))showRplHelp();
});
