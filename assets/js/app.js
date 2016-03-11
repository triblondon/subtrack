
var keycodes = { ENTER: 13, LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, ESC: 27 };
var keygroups = {
	forward: [ keycodes.RIGHT, keycodes.DOWN, keycodes.PAGEDOWN, keycodes.SPACE, keycodes.ENTER ],
	back: [ keycodes.LEFT, keycodes.UP, keycodes.PAGEUP ]
}

$(function() {

	function move(newEls) {
		if (newEls) {
			newEls.prevAll('li').addClass('past').removeClass('current future');
			newEls.addClass('current').removeClass('past future');
			newEls.nextAll('li').addClass('future').removeClass('current past');
		}
	}

	function next() {
		move($('.current').next('li'));
	}

	function prev() {
		move($('.current').prev('li'));
	}

	function loadCaptions(id) {
		var timeout = setTimeout(function() {
			$('.wizard button, .wizard input').removeAttr('disabled');
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
				data.feed.entry.forEach(function(entry) {
					var src = entry['gsx$original']['$t'];
					var target = entry['gsx$customtranslation']['$t'] || entry['gsx$machinetranslation']['$t'];
					if (src && target) {
						$('.captionlist--src').append('<li class="future">'+src+'</li>');
						$('.captionlist--target').append('<li class="future">'+target+'</li>');
					}
				});
				$('.captionlist').each(function() {
					$(this).find('li').eq(0).addClass('current').removeClass('future');
				});
				setUIMode('captions');
			}
		});
	}

	function idFromURL(url) {

		// Possible URL formats:
		// "Get link": https://drive.google.com/open?id=17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8
		// Edit URL: https://docs.google.com/spreadsheets/d/17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8/edit
		// Feed: https://spreadsheets.google.com/feeds/list/17Or0YaUEGtoK-OaxVWs1axz6ABLDJDwohwHOyfmxwF8
		var id = url.match(/[\w\-]{44}/);
		return id ? id[0] : null;

	}

	function resetWizard() {
		$('#txtspreadsheeturl').val('');
		$('#txtspreadsheeturl').closest('.form-group').removeClass('has-error has-success');
		$('#spreadsheeturl-help').empty();
		$('.wizard button, .wizard input').removeAttr('disabled');
	}

	function updateWizardValidation() {
		$('#spreadsheeturl-help').empty();
		if ($('#txtspreadsheeturl').val()) {
			var valid = !!idFromURL($('#txtspreadsheeturl').val());
			$('#txtspreadsheeturl').closest('.form-group').toggleClass('has-success', valid).toggleClass('has-error', !valid);
		} else {
			$('#txtspreadsheeturl').closest('.form-group').removeClass('has-success has-error');
		}
	}

	function setUIMode(mode) {
		document.body.className = 'mode-'+mode;
	}

	$('body').on('keyup', function(e) {
		if ($('body').hasClass('mode-captions')) {
			if (keygroups.forward.includes(e.keyCode)) next();
			else if (keygroups.back.includes(e.keyCode)) prev();
			else if (e.keyCode === keycodes.ESC) {
				resetWizard();
				setUIMode('wizard');
			}
		}
	});

	$('.wizard').on('submit', function(e) {
		var id = idFromURL($('#txtspreadsheeturl').val());
		if (id) {
			$('.wizard button, .wizard input').attr('disabled', 'disabled');
			loadCaptions(id);
		} else {
			$('#txtspreadsheeturl').get(0).focus();
			$('#spreadsheeturl-help').html('This is not a valid Google spreadsheets URL');
		}
		e.preventDefault();
	});

	$('#txtspreadsheeturl').on('keyup', function(e) {
		if (e.keyCode !== keycodes.ENTER) updateWizardValidation();
		e.stopPropagation();
	});


});
