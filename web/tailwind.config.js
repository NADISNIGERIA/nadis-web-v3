/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'nadis-bg': '#FAFFFC',
        'nadis-bg2': '#F8FFFB',
        'nadis-black': '#011B00',
        'nadis-ash': '#909090',
        'nadis-ash2': '#DDDEDD',
        'nadis-fade': '#00000057',
        'nadis-white-fade': '#ffffffd6',
        primary: '#006722',
        'primary-2': '#004D17',
        // Green equivalents for blue color replacements
        'green-50': '#f0fdf4',
        'green-100': '#dcfce7',
        'green-200': '#bbf7d0',
        'green-500': '#22c55e',
        'green-600': '#16a34a',
        'green-700': '#15803d',
        'green-800': '#166534',
        'green-900': '#14532d',
        'card-1': '#FFF1F1',
        'card-2': '#EFEEFF',
        'card-3': '#FCF0E3',
        'card-4': '#E5F6FF',
        'card-5': '#EAFFFA',
        'card-6': '#FDFFEA',
        'card-7': '#003EE81A',
        'card-8': '#9DFBDC26',
        'card-9': '#0000001A',
        'card-10': '#FCE5E5',
        'card-11': '#DCDAFA',
        'card-12': '#F5F5F5',
        'card-13': '#E5EAE7',
        'card-pad-1': '#FF6D6B',
        'card-pad-2': '#9488FF',
        'card-pad-3': '#FF9D0F',
        'card-pad-4': '#52C3FF',
        'card-pad-5': '#43BC9C',
        'card-pad-6': '#B5C144',
        'card-pad-7': '#003EE8',
        'card-pad-8': '#31FF00',
        'card-pad-9': '#000000',
        'dash-card-1': '#50BFAE',
        'dash-card-2': '#FAAA76',
        'dash-card-3': '#4393DB',
        'dash-card-4': '#04DB74',
        'dash-card-5': '#2BCEDF',
        'dash-card-6': '#0B6247',
        'dash-circle-1': '#A2F0E4',
        'dash-circle-2': '#FADDCA',
        'dash-circle-3': '#94BBDE',
        'dash-circle-4': '#D2FFE8',
        'dash-circle-5': '#B9EDF2',
        'dash-circle-6': '#8AC9B5'
      },
      fontSize: {
        xxxs: '.55rem',
        xxs: '.65rem'
      },
      screens: {
        xxs: '375px',
        xs: '425px'
      },
      inset: {
        '1/5': '20%',
        '1/6': '16.666667%',
        '1/10': '10%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%',
        '9/10': '90%'
      },
      width: {
        '1/10': '10%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%',
        '9/10': '90%'
      },
      gridTemplateColumns: {
        // Simple 14 column grid
        14: 'repeat(14, minmax(0, 1fr))',
        // Simple 16 column grid
        16: 'repeat(16, minmax(0, 1fr))',
        // Simple 20 column grid
        20: 'repeat(20, minmax(0, 1fr))',
        // Simple 22 column grid
        22: 'repeat(22, minmax(0, 1fr))',
        // Simple 24 column grid
        24: 'repeat(24, minmax(0, 1fr))',
        // Simple 25 column grid
        25: 'repeat(25, minmax(0, 1fr))',
        // Simple 26 column grid
        26: 'repeat(26, minmax(0, 1fr))',
        // Simple 28 column grid
        28: 'repeat(28, minmax(0, 1fr))',
        // Simple 30 column grid
        30: 'repeat(30, minmax(0, 1fr))',
        // Simple 32 column grid
        32: 'repeat(32, minmax(0, 1fr))',
        // Simple 34 column grid
        34: 'repeat(34, minmax(0, 1fr))',
        // Simple 35 column grid
        35: 'repeat(35, minmax(0, 1fr))',
        // Simple 36 column grid
        36: 'repeat(36, minmax(0, 1fr))',
        // Simple 37 column grid
        37: 'repeat(37, minmax(0, 1fr))',
        // Simple 38 column grid
        38: 'repeat(38, minmax(0, 1fr))',
        // Simple 39 column grid
        39: 'repeat(39, minmax(0, 1fr))',
        // Simple 40 column grid
        40: 'repeat(40, minmax(0, 1fr))',
        // Simple 42 column grid
        41: 'repeat(41, minmax(0, 1fr))',
        // Simple 42 column grid
        42: 'repeat(42, minmax(0, 1fr))',
        // Simple 42 column grid
        43: 'repeat(43, minmax(0, 1fr))',
        // Simple 44 column grid
        44: 'repeat(44, minmax(0, 1fr))',
        // Simple 46 column grid
        46: 'repeat(46, minmax(0, 1fr))',
        // Simple 48 column grid
        48: 'repeat(48, minmax(0, 1fr))',
        // Simple 50 column grid
        50: 'repeat(50, minmax(0, 1fr))',
        // Simple 51 column grid
        51: 'repeat(51, minmax(0, 1fr))',
        // Simple 52 column grid
        52: 'repeat(52, minmax(0, 1fr))',
        // Simple 54 column grid
        54: 'repeat(54, minmax(0, 1fr))',
        // Simple 55 column grid
        55: 'repeat(55, minmax(0, 1fr))',
        // Simple 56 column grid
        56: 'repeat(56, minmax(0, 1fr))',
        // Simple 57 column grid
        57: 'repeat(57, minmax(0, 1fr))',
        // Simple 58 column grid
        58: 'repeat(58, minmax(0, 1fr))',
        // Simple 60 column grid
        60: 'repeat(60, minmax(0, 1fr))',
        // Simple 62 column grid
        62: 'repeat(62, minmax(0, 1fr))',
        // Simple 64 column grid
        64: 'repeat(64, minmax(0, 1fr))',
        // Simple 66 column grid
        66: 'repeat(66, minmax(0, 1fr))',
        // Simple 68 column grid
        68: 'repeat(68, minmax(0, 1fr))',
        // Simple 70 column grid
        70: 'repeat(70, minmax(0, 1fr))',
        // Simple 72 column grid
        72: 'repeat(72, minmax(0, 1fr))',
        // Simple 74 column grid
        74: 'repeat(74, minmax(0, 1fr))',
        // Simple 76 column grid
        76: 'repeat(76, minmax(0, 1fr))',
        // Simple 77 column grid
        77: 'repeat(77, minmax(0, 1fr))',
        // Simple 78 column grid
        78: 'repeat(78, minmax(0, 1fr))',
        // Simple 79 column grid
        79: 'repeat(79, minmax(0, 1fr))',
        // Simple 80 column grid
        80: 'repeat(80, minmax(0, 1fr))',
        // Simple 82 column grid
        82: 'repeat(82, minmax(0, 1fr))',
        // Simple 84 column grid
        84: 'repeat(84, minmax(0, 1fr))',
        // Simple 86 column grid
        86: 'repeat(86, minmax(0, 1fr))',
        // Simple 88 column grid
        88: 'repeat(88, minmax(0, 1fr))',
        // Simple 90 column grid
        90: 'repeat(90, minmax(0, 1fr))',
        // Simple 91 column grid
        91: 'repeat(91, minmax(0, 1fr))',
        // Simple 92 column grid
        92: 'repeat(92, minmax(0, 1fr))',
        // Simple 93 column grid
        93: 'repeat(93, minmax(0, 1fr))',
        // Simple 94 column grid
        94: 'repeat(94, minmax(0, 1fr))',
        // Simple 95 column grid
        95: 'repeat(95, minmax(0, 1fr))',
        // Simple 96 column grid
        96: 'repeat(96, minmax(0, 1fr))',
        // Simple 97 column grid
        97: 'repeat(97, minmax(0, 1fr))',
        // Simple 98 column grid
        98: 'repeat(98, minmax(0, 1fr))',
        // Simple 99 column grid
        99: 'repeat(99, minmax(0, 1fr))',
        // Simple 100 column grid
        100: 'repeat(100, minmax(0, 1fr))',
        // Simple 102 column grid
        102: 'repeat(102, minmax(0, 1fr))'
      },
      gridColumn: {
        'span-13': 'span 13 / span 13',
        'span-14': 'span 14 / span 14',
        'span-15': 'span 15 / span 15',
        'span-16': 'span 16 / span 16',
        'span-17': 'span 17 / span 17',
        'span-18': 'span 18 / span 18',
        'span-19': 'span 19 / span 19',
        'span-20': 'span 20 / span 20'
      },
      margin: {
        '-18': '-4.5rem',
        18: '4.5rem',
        22: '5.5rem',
        '-22': '-5.5rem',
        '-24': '-6rem',
        '-26': '-6.5rem',
        '-28': '-7rem',
        '-30': '-7.5rem',
        26: '6.5rem',
        30: '7.5rem',
        34: '8.5rem',
        38: '9.5rem'
      },
      height: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
        34: '8.5rem',
        38: '9.5rem',
        42: '10.5rem',
        44: '11rem',
        46: '11.5rem',
        50: '12.5rem',
        'screen-80': '80vh'
      }
    }
  },
  plugins: []
}
