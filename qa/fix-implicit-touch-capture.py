from pathlib import Path
p=Path('dist/refinement.js');s=p.read_text(encoding='utf-8').replace("element.addEventListener('lostpointercapture',e=>{if(start)end(e)})", "element.addEventListener('lostpointercapture',e=>{if(start&&e.target===element&&!element.hasPointerCapture(e.pointerId))end(e)})");p.write_text(s,encoding='utf-8')
