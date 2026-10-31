/* Simulator branding is presentation-only: names, form values and exports stay unchanged. */
const SIMULATOR_ICONS={msfs2020:'msfs.png',msfs2024:'msfs.png',xp11:'xplane.svg',xp12:'xplane.svg',p3d:'p3d.png'};
function simulatorIconForName(name){return /MSFS|Microsoft Flight Simulator/i.test(name)?'msfs.png':/X-Plane/i.test(name)?'xplane.svg':/Prepar3D|\bP3D\b/i.test(name)?'p3d.png':null}
function simulatorIconImage(file){const img=document.createElement('img');img.src='img/sim/'+file;img.alt='';img.width=file==='msfs.png'?65:25;img.height=25;img.className='simulator-icon'+(file==='msfs.png'?' simulator-wordmark':'');img.decoding='async';return img}
function decorateSimulatorNames(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 const match=/\b(?:MSFS\s*(?:2020|2024)(?:\/(?:2024|24))?|Microsoft Flight Simulator(?:\s+(?:2020|2024))?|X-Plane(?:\s+(?:11|12)(?:\/12)?)?|Prepar3D(?:\s+v[\d.]+)?|P3D)\b/gi;
 while(walker.nextNode()){const node=walker.currentNode,parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,select,option,.simulator-brand,.cp-card,[contenteditable="true"],[data-simulator-text-only]'))continue;match.lastIndex=0;if(match.test(node.nodeValue))nodes.push(node)}
 for(const node of nodes){const text=node.nodeValue,fragment=document.createDocumentFragment();let offset=0;match.lastIndex=0;for(const result of text.matchAll(match)){fragment.append(document.createTextNode(text.slice(offset,result.index)));const brand=document.createElement('span');brand.className='simulator-brand';brand.append(simulatorIconImage(simulatorIconForName(result[0])),document.createTextNode(result[0]));fragment.append(brand);offset=result.index+result[0].length}fragment.append(document.createTextNode(text.slice(offset)));node.replaceWith(fragment)}
 for(const select of root.querySelectorAll('select')){if([...select.options].some(option=>Object.prototype.hasOwnProperty.call(SIMULATOR_ICONS,option.value)))syncSimulatorSelectIcon(select)}
}
function syncSimulatorSelectIcon(select){
 const file=SIMULATOR_ICONS[select.value];let wrapper=select.parentElement;
 if(!wrapper.classList.contains('simulator-select')){if(!file)return;wrapper=document.createElement('span');wrapper.className='simulator-select';select.before(wrapper);wrapper.append(select)}
 wrapper.querySelector('.simulator-icon')?.remove();if(file)wrapper.prepend(simulatorIconImage(file));
}
document.addEventListener('change',e=>{if(e.target instanceof HTMLSelectElement&&[...e.target.options].some(option=>Object.prototype.hasOwnProperty.call(SIMULATOR_ICONS,option.value)))syncSimulatorSelectIcon(e.target)});
decorateSimulatorNames(document.getElementById('view'));
