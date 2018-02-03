$(() => {
	const keycodes = { A: 65, S: 83, Q: 81, ENTER: 13, LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, ESC: 27 };
	const keygroups = {
		nextSlide: {
			codes: [ keycodes.RIGHT, keycodes.DOWN, keycodes.PAGEDOWN, keycodes.SPACE, keycodes.ENTER ],
			action: () => setCurrent($('.slides .current').next('li'))
		},
		prevSlide: {
			codes: [ keycodes.LEFT, keycodes.UP, keycodes.PAGEUP ],
			action: () => setCurrent($('.slides .current').prev('li'))
		},
		nextCaption: {
			codes: [keycodes.S],
			action: () => setCurrent($('.captions .current').next('li'))
		},
		prevCaption: {
			codes: [keycodes.A],
			action: () => setCurrent($('.captions .current').prev('li'))
		},
		toggleCaptions: { codes: [keycodes.Q], action: toggleCaptions },
		reset: { codes :[keycodes.ESC], action: resetWizard }
	}

	function setCurrent (els) {
		if (els) {
			els.prevAll('li').addClass('past').removeClass('current future');
			els.addClass('current').removeClass('past future');
			els.nextAll('li').addClass('future').removeClass('current past');
		}
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
		document.body.className = 'mode-'+mode;
	}

	function toggleCaptions() {
		$(document.body).toggleClass('with-captions');
	}

	function resetWizard() {
		$('#txtspreadsheeturl').val('');
		$('#txtspreadsheeturl').closest('.form-group').removeClass('has-error has-success');
		$('#spreadsheeturl-help').empty();
		$('.wizard button, .wizard input, .wizard select').removeAttr('disabled');
		setUIMode('wizard');
	}

	$('body').on('keyup', function(e) {
		const keyGroup = Object.keys(keygroups).find(k => keygroups[k].codes.includes(e.keyCode));
		if (keyGroup) keygroups[keyGroup].action();
	});

	$('.wizard').on('submit', function(e) {
		e.preventDefault();
		const id = idFromURL($('#txtspreadsheeturl').val());
		const slides = [];
		if (id) {
			$('.wizard button, .wizard input, .wizard select').attr('disabled', 'disabled');
			var timeout = setTimeout(function() {
				$('.wizard *:disabled').removeAttr('disabled');
				$('#spreadsheeturl-help')
					.html('Unable to load spreadsheet - check that it is published to the web')
					.closest('.form-group')
					.addClass('has-error')
					.removeClass('has-success')
				;
				$('#txtspreadsheeturl').get(0).focus();
			}, 5000);

			// Use start-index, max-results for pagination, see https://developers.google.com/gdata/docs/2.0/reference#Queries
			$.ajax({
				url: 'https://spreadsheets.google.com/feeds/list/'+id+'/od6/public/values?alt=json-in-script',
				dataType: "jsonp",
				success: function(data) {
					clearTimeout(timeout);
					$('.captionlist').empty();
					data.feed.entry.forEach((entry, idx) => {
						var src = entry['gsx$original']['$t'];
						var target = entry['gsx$customtranslation']['$t'] || entry['gsx$machinetranslation']['$t'];
						if (src && target) {
							$('.captionlist--src').append(`<li class="${idx !== 0 ? 'future' : 'current'}"><span>${src}</span></li>`);
							$('.captionlist--target').append(`<li class="${idx !== 0 ? 'future' : 'current'}"><span>${target}</span></li>`);
						}
					});
					if ($('#selslides').val()) {
						for (var i=0; i<$('#selslides option:selected').get(0).dataset.slideCount; i++) {
							const el = document.createElement('li');
							el.style.backgroundImage = `url(/slides/${$('#selslides').val()}/dest-${i}.png)`;
							el.className = i == 0 ? 'current' : 'future';
							slides.push(el);
						}
						const slideList = document.createElement('ol');
						slides.forEach(el => slideList.appendChild(el));
						$('.slides').html(slideList);
					}
					setUIMode(slides.length ? 'slides' : 'captions');
				}
			});
		} else {
			$('#txtspreadsheeturl').get(0).focus();
			$('#spreadsheeturl-help').html('This is not a valid Google spreadsheets URL');
		}
	});

});
