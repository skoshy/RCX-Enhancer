// ==UserScript==
// @name        RCX Enhancer
// @namespace   Violentmonkey Scripts
// @match       http*://*.*.*.*:8080/*
// @match       http*://localhost:8080/*
// @version     0.5.0
// @author      -
// @description 8/19/2021, 12:50:40 AM
// @grant       GM_addStyle
// @downloadURL https://github.com/skoshy/RCX-Enhancer/raw/main/userscript.user.js
// ==/UserScript==

const scriptName = 'rcx-enhancer';

const formats = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
  video: ['.mp4', '.mkv', '.mov', '.m4v', '.flv', '.avi', '.mpeg', '.mpg'],
  text: ['.txt', '.md', '.nfo'],
}

const createElement = (type, attributes = {}, options = {}) => {
  const el = document.createElement(type);
  
  Object.keys(attributes).forEach(key => {
    const val = attributes[key];
    el.setAttribute(key, val);
  });
  
  if (options.prepend) {
    options.prepend.prepend(el);
  }
  
  if (options.append) {
    options.append.append(el);
  }
  
  if (options.innerHTML) {
    el.innerHTML = options.innerHTML;
  }
  
  return el;
}

function readableFileSize(size) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while(size >= 1024) {
      size /= 1024;
      ++i;
    }
    return parseFloat(size).toFixed(2) + ' ' + units[i];
  }

const regexToMatchWithFileAttributes = /(.*)\._\.(.*)(\.[^.]*$)/;
const regexToMatchWithoutFileAttributes = /(.*)(\.[^.]*$)/;

const parseFileAttributes = (attributesString) => {
  const attributes = {};
  
  const splitStrings = attributesString.split('.');
  splitStrings.forEach(splitString => {
    const splitAgainString = splitString.split('_');
    attributes[splitAgainString[0]] = splitAgainString.slice(1).join('_')
  });
  
  return attributes;
}

const parseFileName = (name) => {
  let parsedName = '';
  let fileAttributes = {};
  
  const matchWithAttributes = name.match(regexToMatchWithFileAttributes); 
  if (matchWithAttributes) {
    parsedName = matchWithAttributes[1];
    fileAttributes = parseFileAttributes(matchWithAttributes[2]);
    return {parsedName, fileAttributes};
  }
  
  const matchWithoutAttributes = name.match(regexToMatchWithoutFileAttributes);
  if (matchWithoutAttributes) {
    parsedName = matchWithoutAttributes[1];
    return {parsedName, fileAttributes};
  }
  
  return { parsedName, fileAttributes };
};

const parseFileType = (name) => {
  if (formats.image.some(ext => name.endsWith(ext))) {
    return 'image';
  }
  
  if (formats.video.some(ext => name.endsWith(ext))) {
    return 'video';
  }
  
  if (formats.text.some(ext => name.endsWith(ext))) {
    return 'text';
  }
  
  return 'other';
}

const createFileListEntry = (name, size, date, isFolder, href) => {
  const { parsedName, fileAttributes } = parseFileName(name);
  
  return {
    name,
    type: parseFileType(name),
    parsedName,
    fileAttributes,
    size,
    date,
    isFolder,
    href,
  }
}

const parseFileList = () => {
  const list = [];
  const map = {};
  
  document.querySelectorAll('.file').forEach(row => {
    const name = row.querySelector('.name').innerText;
    const size = row.querySelector('td:nth-child(3)').getAttribute('data-order');
    const date = row.querySelector('td:nth-child(4) time').getAttribute('datetime');
    const isFolder = !!row.querySelector('svg').innerHTML.includes('#folder');
    const href = row.querySelector('a').href;
    
    const fileEntry = createFileListEntry(name, size, date, isFolder, href);
    
    list.push(fileEntry);
    map[fileEntry.parsedName] = map[fileEntry.parsedName] || {};
    map[fileEntry.parsedName][fileEntry.type] = map[fileEntry.parsedName][fileEntry.type] || [];
    map[fileEntry.parsedName][fileEntry.type].push(fileEntry);
  });
  
  return { list, map };
};

const getPreferredVideo = (videos) => {
  const preferredVideoSizes = {
    '1080': 1,
    '720': 2,
    '480': 3,
    '4k': 4,
  };
  
  let preferredVideo = videos[0];
  
  videos.forEach(video => {
    if (!video.name.endsWith('.mp4')) return;
    
    if (preferredVideoSizes[video.fileAttributes?.q] ?? Infinity >= preferredVideoSizes[preferredVideo.fileAttributes?.q] ?? Infinity) return;
    
    if (video.fileAttributes?.priority?.startsWith('low')) return;
    
    preferredVideo = video;
  });
  
  return preferredVideo;
};

const getPreferredImage = (images) => {
  let preferredImage = images[0];
  
  images.forEach(image => {
    if (image.fileAttributes?.t === 'set') return;
    
    preferredImage = image;
  });
  
  return preferredImage;
};

const main = () => {
  // GM_addStyle (`
  //   .listing > table { display: none; }
  // `);
  
  GM_addStyle(`
    .${scriptName}-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100vw;
    }

    .${scriptName}-file {
      max-width: 50vw;
      display: flex;
      flex-direction: column;
      word-wrap: break-word;
    }

    .${scriptName}-thumb {
      max-width: 100%;
    }

    .${scriptName}-text {
      font-size: 0.7rem;
    }

    .${scriptName}-attributes {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }

    .${scriptName}-attribute {
      font-size: 0.5rem;
      padding: 1px;
      background: lightyellow;
      border: 1px solid grey;
      border-radius: 10px;
    }

    .${scriptName}-extra-info {
      font-size: 0.4rem;
    }
  `);
  
  const mainEl = createElement('div', {class: `${scriptName}-main`}, {prepend: document.querySelector('.listing')});
  const { list, map } = parseFileList();
  
  console.log({list, map})
  
  Object.keys(map).forEach(parsedName => {
    const entry = map[parsedName];
    
    if (entry.video) {
      const video = getPreferredVideo(entry.video);
      const image = getPreferredImage(entry.image);
      const imageHref = image?.href;
      
      createElement('a', {href: video.href, class: `${scriptName}-file`}, {append: mainEl, innerHTML: `
        <img class="${scriptName}-thumb" src="${imageHref}" />
        <div class="${scriptName}-text">
          <div>${parsedName}</div>
          <div class="${scriptName}-attributes">
            ${Object.keys(video.fileAttributes).map(attributeName => {
              const attributeValue = video.fileAttributes[attributeName];
              return `<div class="${scriptName}-attribute">${attributeName}_${attributeValue}</div>`;
            }).join('')}
          </div>
          <div class="${scriptName}-extra-info">${readableFileSize(video.size)}, ${video.date.slice(0, 19)}</div>
        </div>
      `});
    }
  });
}

const isThisPageFromRcx = document.querySelector('g#file');
if (isThisPageFromRcx) {
  main();
}
