// ==UserScript==
// @name        RCX Enhancer
// @namespace   Violentmonkey Scripts
// @match       http*://*.*.*.*:8080/*
// @match       http*://localhost:8080/*
// @version     0.2.0
// @author      -
// @description 8/19/2021, 12:50:40 AM
// @grant       GM_addStyle
// @downloadURL https://github.com/skoshy/RCX-Enhancer/raw/main/userscript.user.js
// ==/UserScript==

const scriptName = 'rcx-enhancer';

const imageRegex = /\.(png|jpg)$/;

const main = () => {
  GM_addStyle (`
    .file {
      height: 60px;
    }

    td {
      height: inherit;
      padding: 0;
    }

    .${scriptName}-thumb {
      height: inherit;
      float: left;
    }

    .${scriptName}-extra-text {
      font-size: 50%;
    }


    td:nth-child(2) {
      display: grid;
      grid-template-columns: auto 1fr;
    }

    td:nth-child(2) span {
      margin-left: 0;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    td:nth-child(2) svg {
      position: relative;
    }

    @media (max-width:801px)  {
        .file {
          height: auto;
        }
      
        th:nth-child(3), th:nth-child(4), th:nth-child(5),
        td:nth-child(3), td:nth-child(4), td:nth-child(5) {
          display: none;
        }
      
        .${scriptName}-thumb {
          max-height: 100vh;
          width: 100vw;
        }
      
      
        td:nth-child(2) {
          display: grid;
          grid-template-columns: auto;
          grid-template-rows: auto 1fr;
        }
    }
  `);
  
  function readableFileSize(size) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while(size >= 1024) {
      size /= 1024;
      ++i;
    }
    return parseFloat(size).toFixed(2) + ' ' + units[i];
  }
  
  const findMatchingVideo = (row, name) => {
    if (row.previousElementSibling?.querySelector('a').href.startsWith(name)) {
      return row.previousElementSibling;
    }
    if (row.nextElementSibling?.querySelector('a').href.startsWith(name)) {
      return row.nextElementSibling;
    }
    return null;
  }
  
  // add thumbnails
  document.querySelectorAll('.file').forEach(row => {
    const link = row.querySelector('a').href;
    
    const vidSize = readableFileSize(row.querySelector('td:nth-child(3)').innerText);
    const vidDate = row.querySelector('td:nth-child(4)').innerText;
    const extraText = document.createElement('span');
    extraText.className = `${scriptName}-extra-text`;
    extraText.innerText = `${vidSize}, ${vidDate}`;
    
    row.querySelector('.name').append(document.createElement('br'));
    row.querySelector('.name').append(extraText);

    if (!link.match(imageRegex)) {
      return;
    }

    const linkWithoutExtension = link.replace(imageRegex, '');
    const matchingVideoRow = findMatchingVideo(row, linkWithoutExtension);
    if (!matchingVideoRow) {
      return;
    }

    // add the thumb to the matching video
    let img = document.createElement('img');
    img.src = link;
    img.className = `${scriptName}-thumb`;
    matchingVideoRow.querySelector('td:nth-child(2)').prepend(img);
    matchingVideoRow.querySelector('svg').remove();

    row.remove();
  });
};

const isThisPageFromRcx = document.querySelector('g#file');
if (isThisPageFromRcx) {
  main();
}
