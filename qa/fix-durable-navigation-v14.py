from pathlib import Path
p=Path('qa/refresh-durable-v14.js');s=p.read_text().replace("url+'index.html?final14#transfer'", "url+'index.html?final14='+Date.now()+'#transfer'");p.write_text(s)
