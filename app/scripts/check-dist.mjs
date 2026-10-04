// Derlenmiş paketlerde (dist/ ve dist-single/) şirket içi adres / SharePoint çağrısı kalmadığını doğrular.
import fs from 'node:fs';
import path from 'node:path';

const YASAK = [/turktelekom/i, /ttport/i, /pusulayeni/i, /_api\//i, /_api\b/i, /_vti_bin/i, /\.svc\b/i, /TTGroup\.Modules/i, /odata=verbose/i];
const dosyalar = [];
function gez(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? gez(p) : dosyalar.push(p); } }
for (const d of ['dist', 'dist-single']) if (fs.existsSync(d)) gez(d);
let bulgu = 0;
for (const f of dosyalar) {
  const icerik = fs.readFileSync(f, 'latin1');
  for (const re of YASAK) {
    const m = icerik.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
    if (m) { bulgu += m.length; console.log(`✗ ${f}: ${re} → ${m.length} eşleşme`); }
  }
}
console.log(`${dosyalar.length} dosya tarandı · ${bulgu === 0 ? '✓ yasaklı adres yok' : `${bulgu} bulgu`}`);
process.exit(bulgu ? 1 : 0);
