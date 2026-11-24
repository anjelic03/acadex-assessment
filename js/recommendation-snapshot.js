const snapshotStyles = [
	'align-items', 'background-color', 'background-image', 'border', 'border-radius', 'border-top', 'box-shadow',
	'box-sizing', 'color', 'display', 'flex-direction', 'font-family', 'font-size', 'font-weight',
	'gap', 'grid-template-columns', 'height', 'letter-spacing', 'line-height', 'margin', 'min-height',
	'min-width', 'overflow', 'overflow-wrap', 'padding', 'text-align', 'white-space', 'width',
];

function captureMarkup(cards, title) {
	const stage = document.createElement('div');
	stage.className = 'recommendation-share-stage';
	stage.inert = true;
	stage.setAttribute('aria-hidden', 'true');

	const section = document.createElement('section');
	section.className = 'recommendations-section recommendation-share-capture';
	const brand = document.createElement('strong');
	brand.textContent = 'ACADEX';
	const heading = document.createElement('h2');
	heading.textContent = title;
	const grid = document.createElement('div');
	grid.className = 'recommendations-grid';
	grid.style.gridTemplateColumns = 'repeat(' + cards.length + ', minmax(0, 1fr))';

	for (const card of cards) {
		const snapshotCard = document.createElement('button');
		snapshotCard.className = card.className;
		const hero = card.querySelector('.recommendation-hero').cloneNode(true);
		hero.querySelector('.recommendation-type').remove();

		const body = document.createElement('div');
		body.className = 'recommendation-body';
		body.append(card.querySelector('h3').cloneNode(true));
		const factors = card.querySelector('.recommendation-factors');
		if (factors?.querySelector('.factor-row')) body.append(factors.cloneNode(true));
		snapshotCard.append(hero, body);
		grid.append(snapshotCard);
	}

	section.append(brand, heading, grid);
	stage.append(section);
	document.body.append(stage);

	try {
		const bodies = [...grid.querySelectorAll('.recommendation-body')];
		const bodyHeight = Math.max(...bodies.map((body) => body.offsetHeight));
		bodies.forEach((body) => { body.style.minHeight = bodyHeight + 'px'; });
		const markup = section.cloneNode(true);
		const copies = [markup, ...markup.querySelectorAll('*')];
		[section, ...section.querySelectorAll('*')].forEach((element, index) => {
			const styles = getComputedStyle(element);
			for (const property of snapshotStyles) {
				copies[index].style.setProperty(property, styles.getPropertyValue(property));
			}
		});

		return {
			markup: new XMLSerializer().serializeToString(markup),
			width: section.offsetWidth,
			height: section.offsetHeight,
		};
	} finally {
		stage.remove();
	}
}

async function exportRecommendationSnapshot(cards, title) {
	const { markup, width, height } = captureMarkup(cards, title);
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">'
		+ '<foreignObject width="100%" height="100%">' + markup + '</foreignObject></svg>';
	const image = new Image();
	image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	await image.decode();

	const canvas = document.createElement('canvas');
	const scale = 1440 / width;
	canvas.width = 1440;
	canvas.height = Math.round(height * scale);
	const drawing = canvas.getContext('2d');
	if (!drawing) throw new Error('Canvas unavailable');
	drawing.fillStyle = '#ffffff';
	drawing.fillRect(0, 0, canvas.width, canvas.height);
	drawing.drawImage(image, 0, 0, canvas.width, canvas.height);

	const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!blob) throw new Error('Snapshot unavailable');
	return blob;
}
