import util from './util';
import styles from './styles';
import config from './config';
import regions from '../data/gen/regions.json';


function setupUI(map, legend, info, state) {
  // Summary statistics table
  [...document.querySelectorAll('#summary-tabs--level > div')].forEach((tab) => {
    tab.addEventListener('click', (ev) => {
      ev.preventDefault();
      let val = tab.dataset.value;
      if (val !== state.summary.tab) {
        document.querySelector('#summary-tabs--level .selected').classList.remove('selected');
        state.summary.tab = val;
        tab.classList.add('selected');
        loadSummary(state);
      }
      return false;
    });
  });
  [...document.querySelectorAll('#summary-tabs--stat > div')].forEach((tab) => {
    tab.addEventListener('click', (ev) => {
      ev.preventDefault();
      let val = tab.innerText;
      if (val !== state.summary.stat) {
        document.querySelector('#summary-tabs--stat .selected').classList.remove('selected');
        state.summary.stat = val;
        tab.classList.add('selected');
        loadSummary(state);
      }
      return false;
    });
  });
  loadSummary(state);

  // Jump to region
  let regionsEl = document.getElementById('map-regions');
  Object.keys(regions).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    let bbox = regions[name];
    let regionEl = document.createElement('div');
    regionEl.innerText = name;
    regionEl.addEventListener('click', () => {
      map.fitBounds(bbox);
    });
    regionsEl.appendChild(regionEl);
  });

  // Jump to zipcode
  const zipcodeInput = document.querySelector('#control input[name=zipcode]');
  zipcodeInput.addEventListener('input', (ev) => {
    let zipcode = ev.target.value;
    if (zipcode.length == 5) {
      util.bboxForZip(zipcode).then((bbox) => {
        if (!bbox) return;
        map.fitBounds(bbox);
        map.featsByProp({
          id: 'zctas',
          layer: 'zctas'
        }, 'zipcode', zipcode, (feats) => {
          let feat = feats[0];
          map.focusFeatures({id: 'zctas', layer: 'zctas'}, [feat]);
          info.explain([feat], state.cat, []);
          legend.renderFeatures([feat]);
        });
      });
    }
  });

  // Toggle displayed property
  const propertyAInput = document.querySelector('#control select[name=propertyA]');
  const propertyBInput = document.querySelector('#control select[name=propertyB]');
  const categoryInput = document.querySelector('#control select[name=category]');
  const yearInput = document.querySelector('#control select[name=year]');
  Object.keys(config.PROPS).forEach((property) => {
    let opt = document.createElement('option');

    // Skip categorized properties
    if (property.includes('.')) return;

    let prop = config.PROPS[property];
    opt.innerText = prop.desc;
    opt.value = property;
    propertyAInput.appendChild(opt);
    if (property == state.props[0]) {
      opt.selected = true;
    }

    opt = opt.cloneNode(true);
    propertyBInput.appendChild(opt);
    if (property == state.props[1]) {
      opt.selected = true;
    }
  });
  // To set to univariate
  let opt = document.createElement('option');
  opt.innerText = 'None';
  opt.value = '';
  if (state.props.length == 1) {
    opt.selected = true;
  }
  propertyBInput.appendChild(opt);

  Object.keys(config.CATS['S']).forEach((cat) => {
    let opt = document.createElement('option');
    opt.innerText = config.CATS['S'][cat];
    opt.value = cat;
    categoryInput.appendChild(opt);
    if (cat == state.cat['S']) {
      opt.selected = true;
    }
  });
  Object.keys(config.CATS['Y']).forEach((cat) => {
    let opt = document.createElement('option');
    opt.innerText = config.CATS['Y'][cat];
    opt.value = cat;
    yearInput.appendChild(opt);
    if (cat == state.cat['Y']) {
      opt.selected = true;
    }
  });

  propertyAInput.addEventListener('change', (ev) => {
    state.props[0] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  propertyBInput.addEventListener('change', (ev) => {
    state.props[1] = config.PROPS[util.propForCat(ev.target.value, state.cat)];
    map.set('zctas', state.props);
    legend.set(state.props);
  });
  categoryInput.addEventListener('change', (ev) => {
    state.cat['S'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);
    loadSummary(state);

    // Hide schools not matching the category
    let year = state.cat['Y'];
    if (state.cat['S'] == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', styles.allSchools(year)['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', styles.allSchools(year)['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS['S'][state.cat['S']];
      let style = styles.filteredSchools(year, cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    if (map.focused['zctas']) {
      info.explain(map.focused['zctas'], state.cat, []);
    };
  });
  yearInput.addEventListener('change', (ev) => {
    state.cat['Y'] = ev.target.value;
    state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);
    loadSummary(state);

    // Hide schools not matching the category
    let year = state.cat['Y'];
    if (state.cat['S'] == 'allschools') {
      map.map.setPaintProperty('schools', 'circle-opacity', styles.allSchools(year)['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', styles.allSchools(year)['circle-stroke-opacity']);
    } else {
      let cond = config.CAT_PROP_EXPRS['S'][state.cat['S']];
      let style = styles.filteredSchools(year, cond);
      map.map.setPaintProperty('schools', 'circle-opacity', style['circle-opacity']);
      map.map.setPaintProperty('schools', 'circle-stroke-opacity', style['circle-stroke-opacity']);
    }

    // TODO toggle zip/zone level when new data is ready
  });


  // Toggle properties
  let showAVGNP = document.getElementById('showAVGNP');
  let showSCI = document.getElementById('showSCI');
  let showBoth = document.getElementById('showBoth');
  function setSelected(el) {
    showAVGNP.classList.remove('selected');
    showSCI.classList.remove('selected');
    showBoth.classList.remove('selected');
    el.classList.add('selected');
  }
  showAVGNP.addEventListener('click', () => {
    state.props = [config.PROPS[util.propForCat('AVGNP', state.cat)]];
    map.set('zctas', state.props);
    legend.set(state.props);
    setSelected(showAVGNP);
  });
  showSCI.addEventListener('click', () => {
    state.props = [config.PROPS[util.propForCat('SCI', state.cat)]];
    map.set('zctas', state.props);
    legend.set(state.props);
    setSelected(showSCI);
  });
  showBoth.addEventListener('click', () => {
    state.props = ['SCI', 'AVGNP'].map((p) => config.PROPS[util.propForCat(p, state.cat)]);
    map.set('zctas', state.props);
    legend.set(state.props);
    setSelected(showBoth);
  });

  // Toggle isochrone layer
  [...document.querySelectorAll('#control-isochrone button')].forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelector('#control-isochrone .selected').classList.remove('selected');
      b.classList.add('selected');
      state.cat['I'] = b.value;
      state.props = state.props.map((p) => config.PROPS[util.propForCat(p.key, state.cat)]);
      map.set('zctas', state.props);
      legend.set(state.props);
      loadSummary(state);
      if (map.focused['zctas']) {
        info.explain(map.focused['zctas'], state.cat, []);
      };
    });
  });

  const legendKey = document.getElementById('icon-legend');
  document.getElementById('icon-legend-show').addEventListener('click', () => {
    legendKey.style.display = 'block';
  });
  document.getElementById('icon-legend-close').addEventListener('click', () => {
    legendKey.style.display = '';
  });
}

const summaryEl = document.getElementById('summary-table');
const summaryTitle = document.querySelector('#summary h1 span');
const rowHeads = [
  '', '0<SCI=2500', '2500<SCI=5000', '5000<SCI<10000', 'SCI=10000', 'Education Desert'
];
function loadRows(state, rows) {
  let {summary} = state;
  summaryEl.innerHTML = '';

  let tr = document.createElement('tr');
  rowHeads.forEach((name, i) => {
    if (i == 0) name = summary.tab === 'state' ? 'State' : 'School Type';
    let td = document.createElement('th');
    td.innerText = name;
    tr.appendChild(td);
    td.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (state.summary.sort.column == i) {
        state.summary.sort.reverse = !state.summary.sort.reverse;
      }
      state.summary.sort.column = i;
      loadRows(state, rows);
      return false;
    });
  });
  summaryEl.appendChild(tr);

  rows.sort((a, b) => (a[summary.sort.column] > b[summary.sort.column]) ? 1 : -1);
  if (summary.sort.reverse) {
    rows.reverse();
  }

  rows.forEach((row) => {
    let tr = document.createElement('tr');
    row.forEach((val) => {
      let td = document.createElement('td');
      td.innerText = val || 'N/A';
      tr.appendChild(td);
    });
    summaryEl.appendChild(tr);
  });
}

function loadSummary(state) {
  let url;
  let {summary, cat} = state;
  if (summary.tab === 'state') {
    url = `assets/summary/${summary.tab}-${cat.I}-${cat.Y}-${cat.S}.json`;
    summaryTitle.innerText = `Year: ${cat.Y}, Driving distance: ${cat.I}, Category: ${cat.S}`;
  } else {
    url = `assets/summary/${summary.tab}-${cat.I}-${cat.Y}.json`;
    summaryTitle.innerText = `Year: ${cat.Y}, Driving distance: ${cat.I}`;
  }
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'GET',
  })
    .then(res => res.json())
    .then((json) => {
      let rows = json[summary.stat];
      loadRows(state, rows);
    })
    .catch(err => { console.log(err) });
}

export default setupUI;
