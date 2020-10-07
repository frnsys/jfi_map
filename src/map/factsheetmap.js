import Map from '../lib/map';
import Legend from '../lib/legend';
import Painter from '../lib/paint';
import util from './util';
import styles from './styles';
import SchoolDB from './db';
import color from '../lib/color';
import fipsToState from '../../data/fipsToState.json';
import bboxes from '../../data/gen/fipsToBbox.json';
import regions from '../../data/gen/regions.json';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// For district screenshots
function rangeFocus(prop, statefp) {
  return [
    'case',

    ['!=', ['get', 'STATEFP'], statefp],
      '#333333',

    ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range))
  ];
}

function focusStateFP(map, state, statefp) {
  let paint = rangeFocus(...state.props, statefp);
  map.map.setPaintProperty(
    'main',
    'fill-color',
    paint);
}

function FSMSDMap(config, mapId) {
  const loa = config.LOA;
  const state = config.INITIAL_STATE;
  const tooltip = document.getElementById(`${mapId}--map-tooltip`);

  const db = new SchoolDB(config);

  const dataLayerName = 'data';
  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${config.MAP_ID}`
    }
  };
  const layers = [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': dataLayerName,
    'paint': styles.defaultPlaces
  }];

  function focusFeatures(features, ev) {
    let name = 'National';
    let bbox = regions['Mainland'];
    if (features['main'].length > 0) {
      let statefp = features['main'][0].properties['STATEFP']
      focusStateFP(map, state, statefp);
      name = fipsToState[statefp];
      bbox = bboxes[statefp];
    } else {
      // Reset
      map.set('main', state.props);
    }

    map.fitBounds(bbox);
    let infoEl = document.getElementById(`${mapId}--info`);
    let title = infoEl.querySelector('h2');
    title.innerText = name;
  }

  const painter = new Painter(config.COLORS);
  const map = new Map({
    container: `${mapId}--map`,
    style: 'mapbox://styles/frnsys/ck36ls0sm0hus1cpi2zedg77t',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    center: [-98.5556199, 39.8097343]
  }, sources, layers, {'main': state.props}, painter, focusFeatures, (features, ev) => {
    // if (map.map.getZoom() <= 6) return;

    if (features['main'].length > 0) {
      // Default to first feature
      let feat = features['main'][0];
      let key = util.keyForCat({'Y': state.cat['Y'], 'I': state.cat['I']});
      let loa_keys = feat.properties['loa_key'].split(',');
      let loa_key = loa_keys[0];
      db.dataForKeyPlace(key, loa_key).then((data) => {
        tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
        tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
        tooltip.style.display = 'block';

        let label = `${fipsToState[loa_key.slice(0,2)]}, District ${loa_key.slice(2)}`;
        tooltip.innerHTML = `
          <div><b>${label}</b></div>
          <div><b>Population</b>: ${data['CDPOP'] || 'N/A'}</div>
          <div><b>Median Income</b>: ${formatter.format(data['MEDIANINCOME']) || 'N/A'}</div>
          <div><b>Average Tuition & Fees</b>: ${formatter.format(data['AVGTF.S:allschools']) || 'N/A'}</div>
          ${loa_keys.length > 1 ? `<div>${loa_keys.length - 1} other districts here (zoom in to see).</div>` : ''}
        `;
      });
    } else {
      tooltip.style.display = 'none';
    }
  });
  map.map.on('dragstart', () => {
    tooltip.style.display = 'none';
  });

  const otherColors = {};
  otherColors[`No ${config.SHORT_NAME}`] = '#520004';
  const legend = new Legend(`${mapId}--legend`, map, {id: 'main', layer: 'data'}, state.props, otherColors, ['min']);

  // For getting bounds
  // window.getbbox = () => map.map.getBounds();
  return map;
}

// For district screnshots
function stopToValue(stop, range) {
  return range[0] + (range[1] - range[0]) * stop;
}

function gradientToStyle(gradient, range, idx) {
  return Object.keys(gradient)
    .map((stop) => parseFloat(stop))
    .sort()
    .reduce((acc, stop) => {
      acc.push(stopToValue(stop, range));
      if (idx !== undefined) {
        acc.push(color.hexToRGB(gradient[stop])[idx]);
      } else {
        acc.push(gradient[stop]);
      }
      return acc;
    }, []);
}


export default FSMSDMap;
