
// Brand color, single source of truth. Mirrors the `theme-blue` color defined
// in tailwind.config.js for use in inline styles / JS where Tailwind utility
// classes are not available.
export const THEME_BLUE = '#15AEEF';

export const themes = {
  white: {
    backgroundColor: '#fff',
    borderColor: '#CCCCCC',
    color: '#343E47'
  },
  primary: {
    backgroundColor: THEME_BLUE, 
    color: 'white',
    borderColor: THEME_BLUE,     
  },
  blue: {
    backgroundColor: THEME_BLUE,
    borderColor: '#ccc',
    color: '#fff'
  },
  red: {
    backgroundColor: '#fff',
    borderColor: '#CCCCCC',
    color: '#ff0000'
  },
  green: {
    backgroundColor: '#fff',
    borderColor: '#CCCCCC',
    color: 'darkgreen'
  },
  greenHighlighted: {
    color: '#000',
    backgroundColor: '#00ff008c',
    borderColor: '#CCCCCC',
  },
  gray: {
    backgroundColor: '#d1d5db',
    borderColor: '#d1d5db',
    color: '#fff'
  },
  zone: {
    monitoring: {
      primaryColor: THEME_BLUE,
    },
    stop: {
      primaryColor: '#FD862E'
    },
    no_parking: {
      primaryColor: '#FD3E48'
    },
    //
    quiet: {
      primaryColor: '#48E248',
    },
    moderate: {
      primaryColor: '#FD862E'
    },
    busy: {
      primaryColor: '#FD3E48'
    }
  }
}
