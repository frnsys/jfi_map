import config from '../config';
import cdData from '../data/gen/CD/meta.json';
import zctaData from '../data/gen/ZCTA/meta.json';

let params = window.location.search.substr(1).split('&').reduce((acc, param) => {
    let val = true;
    if (param.includes('=')) [param, val] = param.split('=');
    acc[param] = val;
    return acc;
}, {});


const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

let INITIAL_CAT = {
  S: 'allschools',
  I: '45min',
  Y: '2018'
};

const COLORS = {
  focus: '#f9ca74',
  null: '#6b0106'
};

const PROPS = {
  'SCI': {
    desc: 'School Concentration Index',
    nick: 'SCI',
    color: {
      0.0: '#ffdbdb',
      1.0: '#fa2525'
    },
    legend: {
      flip: false,
      special: {
        'Education Desert': COLORS['null'],
      }
    }
  },
  'AVGNP': {
    desc: 'Average Net Price',
    nick: 'Avg Net Price',
    color: {
      0.0: '#d9ddff',
      1.0: '#263cff'
      // 0.0: '#ffffff',
      // 1.0: '#ffffff'
    },
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Education Desert': COLORS['null'],
      }
    }
  },
  'MEDIANINCOME': {
    desc: 'Median Household Income',
    nick: 'Median Income',
    color: {
      0.0: '#fcfcea',
      0.5: '#e8ca0b',
      1.0: '#079b1d'
    },
    nullColor: '#333333',
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Data Unavailable': '#333333'
      }
    }
  },
  'STU_TOT_BAL': {
    desc: 'Median Total Balance for Student Loan Borrowers aged 18-35',
    nick: 'Median Total Balance',
    color: {
      0.0: '#079b1d',
      0.25: '#f4e61a',
      1.0: '#f4371a'
    },
    nullColor: '#333333',
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Data Unavailable': '#333333'
      }
    }
  }
}


const CATS = {
  S: {
    'allschools': 'All School Types',
    'public': 'Public',
    'privnot4prof': 'Private, not-for-profit',
    'priv4prof': 'Private, for-profit',
    'bachelor': 'Bachelor Degree',
    'associate': 'Associate Degree',
    'belowassociate': 'Below Associate Degree'
  },
  I: {
    '30min': '30 min.',
    '45min': '45 min.',
    '60min': '60 min.'
  },
  Y: { // Show academic year
    '2009': '2008-2009',
    '2010': '2009-2010',
    '2011': '2010-2011',
    '2012': '2011-2012',
    '2013': '2012-2013',
    '2014': '2013-2014',
    '2015': '2014-2015',
    '2016': '2015-2016',
    '2017': '2016-2017',
    '2018': '2017-2018',
    '2019': '2018-2019'
  }
};
const CAT_PROP_EXPRS = {
  'S': {
    'public': ['CONTROL', 1],
    'privnot4prof': ['CONTROL', 2],
    'priv4prof': ['CONTROL', 3],
    'bachelor': ['ICLEVEL', 1],
    'associate': ['ICLEVEL', 2],
    'belowassociate': ['ICLEVEL', 3]
  }
};
const CATS_FOR_PROPS = {
  'SCI': ['S', 'I', 'Y'],
  'n': ['S', 'I', 'Y'],
  'ENROLLED': ['S', 'I', 'Y'],
  'AVGNP': ['S', 'I', 'Y'],
  'AVGTF': ['S', 'I', 'Y'],
  'MEDIANINCOME': ['Y'],
  'STU_TOT_BAL': ['Y'],
};
const PROPS_FOR_LOA = {};
const META = {
  zcta: zctaData,
  cd: cdData
};
const HAS_CATS = Object.keys(CATS_FOR_PROPS);
['zcta', 'cd'].forEach((loa) => {
  PROPS_FOR_LOA[loa] = JSON.parse(JSON.stringify(PROPS));
  HAS_CATS.forEach((p) => {
    if (p in PROPS) {
      const cat_keys = CATS_FOR_PROPS[p].sort((a, b) => a.localeCompare(b)).reduce((acc, k) => {
        if (acc.length == 0) {
          return Object.keys(CATS[k]).map((v) => `${k}:${v}`);
        } else {
          return [].concat(...acc.map((key) => Object.keys(CATS[k]).map((v) => `${key}.${k}:${v}`)));
        }
      }, []);

      cat_keys.forEach((key) => {
        let k = `${p}.${key}`;
        PROPS_FOR_LOA[loa][k] = JSON.parse(JSON.stringify(PROPS[p]));
        PROPS_FOR_LOA[loa][k].key = k;
        PROPS_FOR_LOA[loa][k].range = META[loa].ranges[p];
        PROPS_FOR_LOA[loa][k].stats = {
          min: META[loa].min[k]
        };
      });
    }
  });
});

const INITIAL_CAT_KEY = Object.keys(INITIAL_CAT)
  .sort((a, b) => a.localeCompare(b))
  .map((k) => `${k}:${INITIAL_CAT[k]}`).join('.');

const NO_DATA = [
  'MEDIANINCOME.Y:2019',
];
CATS_FOR_PROPS['AVGNP'].sort((a, b) => a.localeCompare(b)).reduce((acc, k) => {
  if (acc.length == 0) {
    return Object.keys(CATS[k]).map((v) => `${k}:${v}`);
  } else {
    return [].concat(...acc.map((key) => Object.keys(CATS[k]).map((v) => `${key}.${k}:${v}`)));
  }
}, []).filter((k) => k.includes('Y:2019')).forEach((k) => NO_DATA.push(`AVGNP.${k}`));

const CONFIG = {
  COLORS,
  NO_DATA,
  INITIAL_CAT,
  CATS, HAS_CATS, CAT_PROP_EXPRS,
  CATS_FOR_PROPS,
};

export default {
  ZCTA: {
    LOA: 'zcta',
    MAP_ID: 'frnsys.msd__3_0',
    INFO: '<p>The map displays school concentration (<span class="smallcaps">SCI</span>), net price, total student debt, and median income at the <span class="smallcaps">ZCTA</span> level, sortable by year (college category and driving distance toggles are applicable to net price and school concentration maps only). <em style="color:#fff;">All dollar amounts are 2019-inflation adjusted.</em></p>',
    SHORT_NAME: 'zip',
    MIN_PLACE_LENGTH: 5,
    NO_TERRITORIES: false,
    PROPS: PROPS_FOR_LOA['zcta'],
    INITIAL_STATE: {
      cat: INITIAL_CAT,
      props: ['AVGNP'].map((p) => {
        let k = HAS_CATS.includes(p) ? `${p}.${INITIAL_CAT_KEY}` : p;
        return PROPS_FOR_LOA['zcta'][k];
      }),
    },
    ...CONFIG
  },
  CD: {
    LOA: 'cd',
    MAP_ID: 'frnsys.msd_cd__3_2',
    INFO: '<p>Welcome to the Millennial Student Debt map aggregated to Congressional District level!  While some states routinely redraw district lines, this map applies the same district map to all years under analysis - this means you can see how your current district has fluctuated along the variables through time. Happy mapping!</p>',
    SHORT_NAME: 'district',
    MIN_PLACE_LENGTH: 4,
    NO_TERRITORIES: true,
    PROPS: PROPS_FOR_LOA['cd'],
    INITIAL_STATE: {
      cat: INITIAL_CAT,
      props: [PROPS_FOR_LOA['cd']['STU_TOT_BAL.Y:2018']]
    },
    ...CONFIG
  },

  HAS_CATS, CATS_FOR_PROPS, MAPBOX_TOKEN
};
