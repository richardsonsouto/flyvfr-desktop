/* manualupd.js — Atualizações do Manual (out/2026): perfil do piloto (companhia × freelancer), voo livre do freelancer,
   nova página da Frota e novidades da Sala de briefing. Ajusta o texto de MANUAL (app.js) sem reescrevê-lo. */
(function(){
 if(typeof MANUAL==="undefined")return;
 const U={
 pt:{
  toc:[["m-perfil","Perfil do piloto","m-inicio"],["m-livre","Voo livre (freelancer)","m-escala"]],
  inicio:`<p><b>Perfil do piloto.</b> No cadastro você escolhe como vai voar: <b>Piloto de companhia</b> ou <b>Freelancer</b>. Quem já tinha conta escolhe no próximo acesso. Veja a seção <a href="#m-perfil" data-action="man-jump" data-to="m-perfil">Perfil do piloto</a>.</p>`,
  perfil:`<section id="m-perfil"><h3>Perfil do piloto: companhia ou freelancer</h3>
<div class="scroll"><table><thead><tr><th></th><th>✈ Piloto de companhia</th><th>🛩 Freelancer</th></tr></thead><tbody>
<tr><td>Frota que voa</td><td>Só a frota das companhias</td><td>Só a frota dos freelancers: a aeronave que ele cadastrou e as cadastradas por outros freelancers</td></tr>
<tr><td>Como reserva</td><td><b>Escala</b>: voos RPL ou escala livre, gerados pelo app</td><td><b>Voo livre</b>: uma perna ou uma sequência de pernas que o próprio piloto monta</td></tr>
<tr><td>Companhia</td><td>Qualquer companhia, mas só depois de cumprir a última escala</td><td>—</td></tr>
<tr><td>Ranking</td><td>Aba <b>Pilotos de companhia</b></td><td>Aba <b>Freelancers</b></td></tr></tbody></table></div>
<ul><li><b>Trocar de perfil:</b> toque em <b>Trocar perfil</b> no topo da Escala (ou do Voo livre). Pode trocar <b>uma vez a cada 30 dias</b> e só <b>sem voos reservados</b> em aberto. A tela mostra a data da próxima troca possível.</li>
<li><b>Frota compartilhada dos freelancers:</b> ao cadastrar uma aeronave, o freelancer confirma que outros freelancers poderão voá-la e que ele pode voar as deles. A posição e o livro técnico são os mesmos para todos: o próximo voo sai de onde o último pousou.</li>
<li><b>Matrícula única:</b> não é possível cadastrar uma matrícula que já existe na frota.</li>
<li>O ranking do Diário de bordo tem duas abas; cada voo conta na aba da frota da aeronave usada.</li></ul></section>`,
  livre:`<section id="m-livre"><h3>Voo livre (freelancer)</h3>
<p>Para o freelancer, o menu <b>Escala</b> vira <b>Voo livre</b>. Não há geração de escala: você monta os voos.</p>
<ol><li>Escolha a <b>aeronave</b> da frota freelancer (a lista indica “minha” ou de quem a cadastrou e onde está).</li>
<li>A <b>origem da primeira perna</b> é onde a aeronave estará; se ela nunca voou, você escolhe a origem.</li>
<li>Informe o <b>destino</b> e o <b>horário de partida</b> (pelo menos 30 min a partir de agora). O app calcula distância, tempo de calço e chegada e confere o alcance da aeronave.</li>
<li>Para continuar a viagem, toque em <b>＋ Adicionar perna</b>: a próxima sai de onde a anterior pousa, com partida sugerida 1 h depois da chegada (mínimo de 45 min entre chegada e nova partida). Remova uma perna no ✕. Até 24 pernas.</li>
<li>Os números de voo são sugeridos em sequência e podem ser editados. Toque em <b>Reservar voo livre</b> (ou <b>Reservar N voos livres</b>).</li></ol>
<p>Depois da reserva, tudo segue como numa escala: Programação, Sala de briefing, voo rastreado e reporte após o pouso.</p></section>`,
  frota:`<section id="m-frota"><h3>Frota</h3>
<p>A aba <b>Frota</b> mostra a situação de cada matrícula. No topo, os <b>totais acompanham os filtros</b>: aeronaves da seleção, disponíveis agora, em voo agora, reservadas nas próximas 24 h e com restrição ou no solo.</p>
<ul><li><b>Filtros numa fileira:</b> região, companhia, tipo, situação e <b>Ordenar</b> (voadas recentemente, mais voadas, disponíveis primeiro ou matrícula), além da busca por matrícula, tipo ou aeroporto (ex.: <code>SBGR</code>) e do botão <b>Favoritas</b>.</li>
<li><b>Agrupada por modelo:</b> cada grupo mostra quantas aeronaves tem e quantas estão disponíveis.</li>
<li><b>Uma linha por aeronave:</b> matrícula, tipo, <b>onde está</b>, <b>último voo</b> (ex.: “SBGR → SBSV · há 2 d”) ou o próximo evento, <b>histórico</b> (voos e horas no VFR) e situação. As disponíveis têm só um ponto verde; selos coloridos indicam as exceções.</li>
<li><b>Janela estreita</b> (meio monitor): a linha se reorganiza em duas para mostrar tudo. No celular, a frota aparece em cartões.</li>
<li><b>Mais aeronaves:</b> toque em <b>Mostrar mais</b> no fim da lista. <b>Cadastrar:</b> <b>Adicionar aeronave</b>.</li></ul>
<div class="scroll"><table><thead><tr><th>Situação</th><th>O que significa</th><th>Pode voar?</th></tr></thead><tbody>
<tr><td><span class="fv-ok">Disponível</span></td><td>Nenhum item aberto e sem uso nas próximas 24 h</td><td>Sim</td></tr>
<tr><td><span class="pill fv-fly">Em voo</span></td><td>Um piloto está com a aeronave agora; a linha diz quando chega</td><td>Depois da chegada, a partir do destino</td></tr>
<tr><td><span class="pill fv-res">Reservada</span></td><td>Tem reserva nas próximas 24 h (o horário aparece no selo)</td><td>Fora do horário reservado</td></tr>
<tr><td><span class="pill warn">Com restrição</span></td><td>Item diferido (MEL); voa seguindo o procedimento indicado</td><td>Sim, simulando a restrição</td></tr>
<tr><td><span class="pill bad">AOG</span></td><td>No solo para manutenção; a linha mostra quando volta</td><td>Só depois da liberação</td></tr>
<tr><td><span class="pill fv-new">Sem histórico</span></td><td>Nunca voada no VFR; o primeiro voo escolhe a origem</td><td>Sim</td></tr></tbody></table></div>
<p>Toque numa linha para abrir o <b>livro técnico</b>: foto, resumo (onde está, quando fica disponível, próxima reserva e último piloto), itens abertos e procedimentos, manutenções programadas, pinturas para simulador, horas de célula, ciclos e todas as páginas de voo. Os freelancers veem só a frota freelancer; os pilotos de companhia, só a frota das companhias.</p></section>`,
  brief:`<p><b>Submenu da Sala de briefing:</b> Voo, Aeronave, Voo rastreado, Mapa, Meteorologia, NOTAMs, Redes online, Cartas, Plano de voo e Checklist do briefing — cada um com seu ícone na barra lateral do briefing.</p>
<ul><li><b>Aeronave:</b> matrícula e modelo, <b>pinturas para simulador</b> (links para baixar no flightsim.to ou x-plane.org, filtrados pelos simuladores do seu Perfil) e o livro técnico.</li>
<li><b>Voo rastreado:</b> “Como conectar o seu simulador” abre na mesma página, abaixo dos dados do voo.</li>
<li><b>Cartas:</b> em “Pré-selecionadas para o voo”, cada carta mantém a cor do seu tipo (ADC azul, SID verde, STAR roxa, IAC magenta…), como em “Outras cartas disponíveis”. Marque as que quiser e use <b>Baixar em um PDF</b>.</li></ul>`,
  faq:`<tr><td>Quero trocar de companhia para freelancer (ou o contrário)</td><td>Use <b>Trocar perfil</b> na Escala/Voo livre: uma vez a cada 30 dias e sem voos reservados</td></tr>
<tr><td>Sou freelancer e a frota está vazia</td><td>Cadastre a aeronave que você voa em <b>Adicionar aeronave</b> (com a matrícula real) ou voe uma já cadastrada por outro freelancer</td></tr>`
 },
 en:{
  toc:[["m-perfil","Pilot profile","m-inicio"],["m-livre","Free flight (freelancer)","m-escala"]],
  inicio:`<p><b>Pilot profile.</b> When signing up you choose how you will fly: <b>Airline pilot</b> or <b>Freelancer</b>. Existing pilots choose at their next sign-in. See <a href="#m-perfil" data-action="man-jump" data-to="m-perfil">Pilot profile</a>.</p>`,
  perfil:`<section id="m-perfil"><h3>Pilot profile: airline or freelancer</h3>
<div class="scroll"><table><thead><tr><th></th><th>✈ Airline pilot</th><th>🛩 Freelancer</th></tr></thead><tbody>
<tr><td>Fleet flown</td><td>Airline fleets only</td><td>Freelancer fleet only: the aircraft they registered and those registered by other freelancers</td></tr>
<tr><td>How to book</td><td><b>Roster</b>: RPL or free roster generated by the app</td><td><b>Free flight</b>: one leg or a sequence of legs built by the pilot</td></tr>
<tr><td>Airline</td><td>Any airline, after completing the last roster</td><td>—</td></tr>
<tr><td>Ranking</td><td><b>Airline pilots</b> tab</td><td><b>Freelancers</b> tab</td></tr></tbody></table></div>
<ul><li><b>Change profile:</b> tap <b>Change profile</b> at the top of Roster (or Free flight). Allowed <b>once every 30 days</b> and only with <b>no booked flights</b>. The screen shows the next date you can change.</li>
<li><b>Shared freelancer fleet:</b> when registering an aircraft, the freelancer confirms that other freelancers can fly it and that they can fly theirs. Position and technical log are shared: the next flight departs where the last one landed.</li>
<li><b>Unique registration:</b> a registration already in the fleet cannot be added again.</li>
<li>The Logbook ranking has two tabs; each flight counts in the tab of the aircraft's fleet.</li></ul></section>`,
  livre:`<section id="m-livre"><h3>Free flight (freelancer)</h3>
<p>For freelancers, the <b>Roster</b> menu becomes <b>Free flight</b>. There is no roster generation: you build the flights.</p>
<ol><li>Choose an <b>aircraft</b> from the freelancer fleet (the list shows “mine” or who registered it, and where it is).</li>
<li>The <b>first leg's origin</b> is where the aircraft will be; if it never flew, you choose the origin.</li>
<li>Enter the <b>destination</b> and <b>departure time</b> (at least 30 min from now). The app computes distance, block time and arrival and checks the aircraft's range.</li>
<li>To continue the trip, tap <b>＋ Add leg</b>: the next leg departs where the previous one lands, with departure suggested 1 h after arrival (minimum 45 min between arrival and the next departure). Remove a leg with ✕. Up to 24 legs.</li>
<li>Flight numbers are suggested in sequence and can be edited. Tap <b>Book free flight</b> (or <b>Book N free flights</b>).</li></ol>
<p>After booking, everything works as with a roster: Schedule, Briefing room, tracked flight and post-landing report.</p></section>`,
  frota:`<section id="m-frota"><h3>Fleet</h3>
<p>The <b>Fleet</b> tab shows each registration's status. At the top, <b>totals follow the filters</b>: aircraft in the selection, available now, in flight now, booked in the next 24 h and restricted or grounded.</p>
<ul><li><b>One-row filters:</b> region, airline, type, status and <b>Sort</b> (recently flown, most flown, available first or registration), plus search by registration, type or airport (e.g. <code>SBGR</code>) and the <b>Favorites</b> button.</li>
<li><b>Grouped by model:</b> each group shows how many aircraft it has and how many are available.</li>
<li><b>One row per aircraft:</b> registration, type, <b>where it is</b>, <b>last flight</b> (e.g. “SBGR → SBSV · 2 d ago”) or the next event, <b>history</b> (flights and hours on VFR) and status. Available aircraft show just a green dot; coloured badges flag exceptions.</li>
<li><b>Narrow window</b> (half screen): the row wraps into two lines so nothing is cut. On phones the fleet shows as cards.</li>
<li><b>More aircraft:</b> tap <b>Show more</b> at the end. <b>Register:</b> <b>Add aircraft</b>.</li></ul>
<div class="scroll"><table><thead><tr><th>Status</th><th>Meaning</th><th>Can fly?</th></tr></thead><tbody>
<tr><td><span class="fv-ok">Available</span></td><td>No open items and not in use in the next 24 h</td><td>Yes</td></tr>
<tr><td><span class="pill fv-fly">In flight</span></td><td>A pilot has the aircraft now; the row shows the arrival time</td><td>After arrival, from the destination</td></tr>
<tr><td><span class="pill fv-res">Booked</span></td><td>Has a booking in the next 24 h (time on the badge)</td><td>Outside the booked time</td></tr>
<tr><td><span class="pill warn">Restricted</span></td><td>Deferred item (MEL); flies following the procedure</td><td>Yes, simulating the restriction</td></tr>
<tr><td><span class="pill bad">AOG</span></td><td>Grounded for maintenance; the row shows when it returns</td><td>Only after release</td></tr>
<tr><td><span class="pill fv-new">No history</span></td><td>Never flown on VFR; the first flight chooses the origin</td><td>Yes</td></tr></tbody></table></div>
<p>Tap a row to open the <b>technical log</b>: photo, summary (where it is, when it is available, next booking and last pilot), open items and procedures, scheduled maintenance, simulator liveries, airframe hours, cycles and every flight page. Freelancers see only the freelancer fleet; airline pilots, only the airline fleets.</p></section>`,
  brief:`<p><b>Briefing room submenu:</b> Flight, Aircraft, Tracked flight, Map, Weather, NOTAMs, Online networks, Charts, Flight plan and Briefing checklist — each with its own icon in the briefing side bar.</p>
<ul><li><b>Aircraft:</b> registration and model, <b>simulator liveries</b> (download links on flightsim.to or x-plane.org, filtered by the simulators in your Profile) and the technical log.</li>
<li><b>Tracked flight:</b> “How to connect your simulator” opens on the same page, below the flight data.</li>
<li><b>Charts:</b> under “Preselected for this flight”, each chart keeps its type colour (ADC blue, SID green, STAR purple, IAC magenta…), as in “Other available charts”. Tick the ones you want and use <b>Download as one PDF</b>.</li></ul>`,
  faq:`<tr><td>I want to switch from airline pilot to freelancer (or back)</td><td>Use <b>Change profile</b> in Roster/Free flight: once every 30 days and with no booked flights</td></tr>
<tr><td>I'm a freelancer and the fleet is empty</td><td>Register the aircraft you fly with <b>Add aircraft</b> (real registration) or fly one already registered by another freelancer</td></tr>`
 }};
 for(const k of Object.keys(U)){const M=MANUAL[k],u=U[k];if(!M||M.fvUpdated)continue;let b=M.body;
  /* sumário: Perfil depois de Primeiros passos; Voo livre depois de Escala */
  for(const [id,label,after] of u.toc){if(M.toc.some(x=>x[0]===id))continue;const i=M.toc.findIndex(x=>x[0]===after);M.toc.splice(i<0?M.toc.length:i+1,0,[id,label])}
  b=b.replace(/(<section id="m-inicio">[\s\S]*?)(<\/section>)/,(m,a,c)=>a+u.inicio+c+"\n"+u.perfil);
  b=b.replace(/(<section id="m-escala">[\s\S]*?<\/section>)/,(m)=>m+"\n"+u.livre);
  b=b.replace(/<section id="m-frota">[\s\S]*?<\/section>/,u.frota);
  b=b.replace(/(<section id="m-brief">[\s\S]*?)(<\/section>)/,(m,a,c)=>a+u.brief+c);
  b=b.replace(/(<section id="m-faq">[\s\S]*?)(<\/tbody>)/,(m,a,c)=>a+u.faq+c);
  M.body=b;M.fvUpdated=true}
})();
