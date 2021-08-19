// ==UserScript==
// @name        RCX Enhancer
// @namespace   Violentmonkey Scripts
// @match       http://192.168.10.241:8080/*
// @match       http://localhost:8080/*
// @version     0.1.0
// @author      -
// @description 8/19/2021, 12:50:40 AM
// @grant       GM_addStyle
// ==/UserScript==

const scriptName = 'rcx-enhancer';

const imageRegex = /\.(png|jpg)$/;

const main = () => {
  GM_addStyle (`
    .file {
      height: 40px;
    }

    td {
      height: inherit;
      padding: 0;
    }

    .${scriptName}-thumb {
      height: inherit;
    }
  `);
  
  // add thumbnails
  document.querySelectorAll('.file').forEach(row => {
    const link = row.querySelector('a').href;

    if (!link.match(imageRegex)) {
      return;
    }

    const linkWithoutExtension = link.replace(imageRegex, '');
    if (!row.previousElementSibling?.querySelector('a').href.startsWith(linkWithoutExtension)) {
      return;
    }

    let img = document.createElement('img');
    img.src = link;
    img.className = `${scriptName}-thumb`;

    row.previousElementSibling.querySelector('td:nth-child(2)').prepend(img);
    row.previousElementSibling.querySelector('svg').remove();

    row.remove();
  });
};

const isThisPageFromRcx = document.querySelector('g#file');
if (isThisPageFromRcx) {
  main();
}
