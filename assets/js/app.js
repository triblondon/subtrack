document.addEventListener('DOMContentLoaded', () => {

	const keygroups = {
		nextSlide: {
			codes: [ 'ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter' ],
			action: () => move('slides', 'next')
		},
		prevSlide: {
			codes: [ 'ArrowLeft', 'ArrowUp', 'PageUp' ],
			action: () => move('slides', 'prev')
		},
		nextCaption: {
			codes: [ 's' ],
			action: () => move('captions', 'next')
		},
		prevCaption: {
			codes: [ 'a' ],
			action: () => move('captions', 'prev')
		},
		toggleCaptions: { codes: [ 'q' ], action: toggleCaptions },
		toggleMode: { codes: [ 'm' ], action: () => setUIMode(document.body.classList.contains('mode-captions') ? 'slides' : 'captions') },
		reset: { codes: [ 'Escape' ], action: resetWizard }
	}
	const spreadsheetUrlEl = document.getElementById('txtspreadsheeturl');

	function move (type, direction) {
		const lists = document.querySelectorAll('.'+type+' ol');
		lists.forEach(list => {
			const nodes = Array.from(list.querySelectorAll('li'));
			const curIdx = nodes.findIndex(el => el.classList.contains('current'));
			const tgtIdx = direction === 'next' ? Math.min(nodes.length - 1, curIdx + 1) : Math.max(0, curIdx - 1);
			nodes.forEach((n, idx) => {
				n.classList.remove('past', 'current', 'future');
				n.classList.add(idx < tgtIdx ? 'past' : idx === tgtIdx ? 'current' : 'future');
			})
		})
	}

	function idFromURL (url) {
		// Valid URL formats include:
		// "Get link": https://drive.google.com/open?id=17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8
		// Edit URL: https://docs.google.com/spreadsheets/d/17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8/edit
		// Feed: https://spreadsheets.google.com/feeds/list/17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8
		const id = url.match(/[\w\-]{44}/);
		return id ? id[0] : null;
	}

	function setUIMode(mode) {
		document.body.classList.remove('mode-wizard', 'mode-slides', 'mode-captions')
		document.body.classList.add('mode-' + mode);
	}

	function toggleCaptions() {
		document.body.classList.toggle('with-captions');
	}

	function resetWizard() {
		spreadsheetUrlEl.value = '';
		spreadsheetUrlEl.closest('.form-group').classList.remove('has-error', 'has-success');
		document.getElementById('spreadsheeturl-help').innerHTML = ''
		document.querySelectorAll('.wizard button, .wizard input, .wizard select').forEach(el => { el.disabled = false; });
		setUIMode('wizard');
	}

	document.body.addEventListener('keyup', e => {
		console.log(e.key);
		const keyGroup = Object.keys(keygroups).find(k => keygroups[k].codes.includes(e.key));
		if (keyGroup) keygroups[keyGroup].action();
	});

	document.querySelector('.wizard').addEventListener('submit', async e => {
		e.preventDefault();
		const id = idFromURL(spreadsheetUrlEl.value);
		const slides = [];

		if (!id) {
			spreadsheetUrlEl.focus();
			document.getElementById('spreadsheeturl-help').innerHTML = 'This is not a valid Google spreadsheets URL';
			return;
		}

		document.querySelectorAll('.wizard button, .wizard input, .wizard select').forEach(el => { el.disabled = true; });

		const timeout = setTimeout(() => {
			document.querySelectorAll('.wizard *:disabled').forEach(el => { el.disabled = false; });
			spreadsheetUrlEl.focus();
			document.getElementById('spreadsheeturl-help').innerHTML = 'Unable to load spreadsheet - check that it is published to the web';
			const frmGrpEl = document.getElementById('spreadsheeturl-help').closest('.form-group');
			frmGrpEl.classList.add('has-error');
			frmGrpEl.classList.remove('has-success');
		}, 5000);

		// Use start-index, max-results for pagination, see https://developers.google.com/gdata/docs/2.0/reference#Queries
		const resp = await fetch('https://spreadsheets.google.com/feeds/list/'+id+'/od6/public/values?alt=json');
		const data = await resp.json();
		clearTimeout(timeout);

		let srcHTML = targetHTML = '';
		data.feed.entry.forEach((entry, idx) => {
			const src = entry['gsx$original']['$t'];
			const target = entry['gsx$customtranslation']['$t'] || entry['gsx$machinetranslation']['$t'];
			if (src && target) {
				srcHTML += `<li class="${idx !== 0 ? 'future' : 'current'}"><span>${src}</span></li>`;
				targetHTML += `<li class="${idx !== 0 ? 'future' : 'current'}"><span>${target}</span></li>`;
			}
		});
		document.querySelector('.captionlist--src').innerHTML = srcHTML;
		document.querySelector('.captionlist--target').innerHTML = targetHTML;

		const selSlidesEl = document.getElementById('selslides');
		if (selSlidesEl.value) {
			const slideCount = selSlidesEl.querySelector('option:checked').dataset.slideCount
			const slideList = document.createElement('ol');
			for (var i=0; i<slideCount; i++) {
				const el = document.createElement('li');
				el.style.backgroundImage = `url(slides/${selSlidesEl.value}/dest-${i}.png)`;
				el.className = i == 0 ? 'current' : 'future';
				slideList.appendChild(el)
			}
			document.querySelector('.slides').innerHTML = '';
			document.querySelector('.slides').appendChild(slideList);
			setUIMode('slides')
		} else {
			setUIMode('captions');
		}
	});
});
