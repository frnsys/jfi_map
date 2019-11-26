import util from './util';
import config from './config';
import info from './lib/info';
import schools from '../data/schools.json';
import zipSchools from '../data/zip_schools.json';

const CONTROL = {
  1: 'Public',
  2: 'Private not-for-profit',
  3: 'Private for-profit',
};
const LEVEL = {
  1: 'Bachelor degree',
  2: 'Associate degree',
  3: 'Below associate degree'
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function explain(feats, cat, focusedSchools) {
  let html = feats.map((feat) => {
    let p = feat.properties;
    let d = ['SCI', 'UNDUPUG', 'n'].reduce((acc, k) => {
      acc[k] = p[util.propForCat(k, cat)];
      return acc;
    }, {});

    let [zipcode, ...otherZips] = p['zipcode'].split(',');
    let key = util.keyForCat({'Y': cat['Y'], 'I': cat['I']});
    let yearKey = util.keyForCat({'Y': cat['Y']});
    let schoolIds = zipSchools[zipcode] ? zipSchools[zipcode][key] : [];
    let schoolsForZCTA = schoolIds.map((id) => schools[id]);
    let groupedSchools = {};

    let [filterKey, filterVal] = !(cat['S'] == 'allschools') ? config.CAT_PROP_EXPRS['S'][cat['S']] : [null, null];

    schoolsForZCTA.forEach((s) => {
      // priv/public/nonprofit
      let control = s['CONTROL'];
      if (filterKey == 'CONTROL' && control !== filterVal) return;

      // degree types
      let level = s['ICLEVEL'];
      if (filterKey == 'ICLEVEL' && level !== filterVal) return;

      if (!(control in groupedSchools)) {
        groupedSchools[control] = {};
      }
      if (!(level in groupedSchools[control])) {
        groupedSchools[control][level] = [];
      }
      groupedSchools[control][level].push(s);
    });

    return `
      <h2>${zipcode}</h2>
      SCI: ${d['SCI'] > 0 ? d['SCI'].toFixed(2) : 'Education Desert'}<br/>
      Number of Schools: ${d['n'] || 'N/A'}<br/>
      Enrollment Seats: ${d['UNDUPUG'] || 0}<br/>
      25mi Zone Population Estimate: ${p[`zctazonepop.${yearKey}`] || 'N/A'}<br/>
      Median Income: ${p[`medianincome.${yearKey}`] ? formatter.format(p[`medianincome.${yearKey}`]) : 'N/A'}<br/>
      ${otherZips.length > 0 ? `<div class="other-zctas">Other ZCTAs here: ${otherZips.join(', ')}</div>` : ''}

      ${feats.length == 1 ? `
        <h2>Schools for ZCTA</h2>
        ${Object.keys(groupedSchools).map((control) => {
          return Object.keys(groupedSchools[control]).map((level) => {
            return `
              <h3>${CONTROL[control]}, ${LEVEL[level]}</h3>
              <ul class="zcta-schools">
                ${groupedSchools[control][level].sort((a, b) => a['INSTNM'].localeCompare(b['INSTNM']))
                  .map((s) => `<li>${s['INSTNM']}</li>`).join('\n')}
              </ul>
            `;
          }).join('\n');
        }).join('\n')}` : ''}
    `;
  }).join('\n');
  html += `
    ${focusedSchools.length > 0 ?
        `<h2>School</h2>
        ${focusedSchools.sort((a, b) => a.properties['INSTNM'].localeCompare(b.properties['INSTNM'])).map((s) => `${s.properties['INSTNM']}<br />`).join('\n')}`
      : ''}`;

  info.explainFeature(html);
}

function empty() {
  info.explainFeature(`<p class="no-zcta">This geographic area does not have a resident population and therefore does not have a ZCTA. Typical examples of this region include national or state parks and large bodies of water.</p>`);
}

function reset() {
  info.explainFeature(`<h2>About this project</h2><p>TK</p>`);
}

function schoolsOnly() {
  info.explainFeature(`
    <h2>Total Higher Education Institutions: 6,295</h2>
    <h3>By Control:</h3>
    <ul>
      <li>Public: 1,954</li>
      <li>Private not-for-profit: 1,599</li>
      <li>Private for-profit: 2,742</li>
    </ul>
    <h3>By Level:</h3>
    <ul>
      <li>Bachelor: 2,532</li>
      <li>Associate: 1,961</li>
      <li>Below Associate: 1,802</li>
    </ul>
    <em>*For information on our exclusion criteria, see the Methodology section at the bottom of this page.</em>`);
}

export default {
  explain, empty, reset, schoolsOnly
};
