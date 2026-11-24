function populateProgramBrowser(browser) {
	const normalize = (name) => name.trim().toLocaleLowerCase();
	const catalog = window.assessmentPrograms;
	const faculties = new Map(catalog.filter((program) => program.faculty)
		.map((program) => [normalize(program.faculty), { name: program.faculty, code: program.faculty_code }]));
	const tabs = browser.querySelector('[data-programs-tabs]');
	const emptyFaculty = browser.querySelector('[data-faculty-empty]');
	const emptyProgram = browser.querySelector('[data-program-empty]');

	for (const [key, { name, code }] of [...faculties].sort(([, a], [, b]) => a.name.localeCompare(b.name))) {
		const label = name.replace(/^Faculty of\s+/i, '');
		const tab = document.createElement('button');
		tab.className = 'tab-pill';
		tab.type = 'button';
		tab.setAttribute('role', 'tab');
		tab.setAttribute('aria-selected', 'false');
		tab.dataset.programFilter = key;
		tab.dataset.facultyName = name;
		tab.dataset.facultyAbbr = code;
		tab.textContent = label;
		tabs.append(tab);

		const option = document.createElement('button');
		option.className = 'faculty-picker__option';
		option.type = 'button';
		option.dataset.facultyOption = key;
		option.setAttribute('aria-pressed', 'false');
		option.textContent = label;
		emptyFaculty.before(option);

		if (code.toLowerCase() === 'facet') browser.dataset.defaultFaculty = key;
	}

	for (const program of catalog) {
		const row = document.createElement('tr');
		row.dataset.programCard = '';
		row.dataset.faculty = normalize(program.faculty);
		row.dataset.search = program.code + ' ' + program.name;
		const code = document.createElement('span');
		code.className = 'program-code';
		code.textContent = program.code;
		row.insertCell().append(code);
		row.insertCell().textContent = program.name;

		const description = document.createElement('details');
		description.className = 'program-description';
		const summary = document.createElement('summary');
		const context = document.createElement('span');
		context.className = 'sr-only';
		context.textContent = ' of ' + program.name;
		summary.append('View description', context);
		const paragraph = document.createElement('p');
		paragraph.textContent = program.description || 'No description available.';
		description.append(summary, paragraph);
		row.insertCell().append(description);
		emptyProgram.before(row);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const body = document.body;
	const programBrowser = document.querySelector('[data-program-browser]');
	if (programBrowser) {
		populateProgramBrowser(programBrowser);
		const programCards = [...programBrowser.querySelectorAll('[data-program-card]')];
		const programFilters = [...programBrowser.querySelectorAll('[data-program-filter]')];
		const facultyName = programBrowser.querySelector('#programsFacultyName');
		const facultyAbbreviation = programBrowser.querySelector('#programsFacultyAbbr');
		const search = programBrowser.querySelector('[data-program-search]');
		const empty = programBrowser.querySelector('[data-program-empty]');
		const sortButtons = [...programBrowser.querySelectorAll('[data-program-sort-column]')];
		const mobileSort = programBrowser.querySelector('[data-program-sort]');
		const programCount = programBrowser.querySelector('[data-program-count]');
		const facultyPicker = programBrowser.querySelector('#facultyPicker');
		const pickerTrigger = programBrowser.querySelector('[data-faculty-picker-open]');
		const pickerValue = programBrowser.querySelector('#facultyPickerValue');
		const facultySearch = programBrowser.querySelector('[data-faculty-search]');
		const facultyOptions = [...programBrowser.querySelectorAll('[data-faculty-option]')];
		const facultyEmpty = programBrowser.querySelector('[data-faculty-empty]');
		const mobilePrograms = window.matchMedia('(max-width: 900px)');
		let selectedFaculty = programBrowser.dataset.defaultFaculty || 'all';
		const updatePrograms = () => {
			const query = search?.value.trim().toLocaleLowerCase() || '';
			let visibleCount = 0;
			programCards.forEach((card) => {
				card.hidden = (selectedFaculty !== 'all' && card.dataset.faculty !== selectedFaculty)
					|| !card.dataset.search.toLocaleLowerCase().includes(query);
				if (!card.hidden) visibleCount++;
			});
			if (empty) empty.hidden = visibleCount > 0;
			if (programCount) programCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'program' : 'programs'}`;
		};

		const selectFaculty = (filter) => {
			selectedFaculty = filter.dataset.programFilter;
			programFilters.forEach((item) => {
				const isActive = item === filter;
				item.classList.toggle('is-active', isActive);
				item.setAttribute('aria-selected', String(isActive));
			});
			facultyOptions.forEach((option) => {
				option.setAttribute('aria-pressed', String(option.dataset.facultyOption === selectedFaculty));
			});
			if (facultyName) facultyName.textContent = filter.dataset.facultyName || selectedFaculty;
			if (facultyAbbreviation) facultyAbbreviation.textContent = filter.dataset.facultyAbbr || selectedFaculty;
			if (pickerValue) pickerValue.textContent = filter.textContent.trim();
			updatePrograms();
		};

		programFilters.forEach((filter) => {
			filter.addEventListener('click', () => selectFaculty(filter));
		});
		search?.addEventListener('input', () => {
			updatePrograms();
		});

		const filterFacultyOptions = () => {
			const query = facultySearch.value.trim().toLocaleLowerCase();
			let visibleCount = 0;
			facultyOptions.forEach((option) => {
				option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
				if (!option.hidden) visibleCount++;
			});
			facultyEmpty.hidden = visibleCount > 0;
		};
		pickerTrigger?.addEventListener('click', () => {
			facultySearch.value = '';
			filterFacultyOptions();
			facultyPicker.showModal();
			body.classList.add('faculty-picker-open');
			pickerTrigger.setAttribute('aria-expanded', 'true');
			facultyOptions.find((option) => option.dataset.facultyOption === selectedFaculty)?.focus();
		});
		facultySearch?.addEventListener('input', filterFacultyOptions);
		programBrowser.querySelector('[data-faculty-picker-close]')?.addEventListener('click', () => facultyPicker.close());
		facultyPicker?.addEventListener('close', () => {
			body.classList.remove('faculty-picker-open');
			pickerTrigger.setAttribute('aria-expanded', 'false');
			if (mobilePrograms.matches) pickerTrigger.focus();
		});
		facultyPicker?.addEventListener('click', (event) => {
			const bounds = facultyPicker.getBoundingClientRect();
			if (event.target === facultyPicker && (event.clientY < bounds.top || event.clientY > bounds.bottom || event.clientX < bounds.left || event.clientX > bounds.right)) {
				facultyPicker.close();
			}
		});
		facultyOptions.forEach((option) => {
			option.addEventListener('click', () => {
				const filter = programFilters.find((item) => item.dataset.programFilter === option.dataset.facultyOption);
				if (filter) selectFaculty(filter);
				facultyPicker.close();
			});
		});
		const updateProgramLayout = () => {
			sortButtons.forEach((button) => { button.tabIndex = mobilePrograms.matches ? -1 : 0; });
			if (!mobilePrograms.matches && facultyPicker?.open) facultyPicker.close();
		};
		mobilePrograms.addEventListener('change', updateProgramLayout);
		updateProgramLayout();

		const sortPrograms = (column, direction) => {
			const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
			const multiplier = direction === 'desc' ? -1 : 1;
			const tableBody = programBrowser.querySelector('tbody');
			programCards.sort((first, second) => collator.compare(first.cells[column].textContent.trim(), second.cells[column].textContent.trim()) * multiplier);
			programCards.forEach((card) => tableBody.insertBefore(card, empty));
			sortButtons.forEach((button) => {
				const isCurrent = Number(button.dataset.programSortColumn) === column;
				button.dataset.sortDirection = isCurrent ? direction : '';
				button.closest('th')?.setAttribute('aria-sort', isCurrent ? `${direction}ending` : 'none');
			});
			if (mobileSort) mobileSort.value = `${column}-${direction}`;
		};
		sortButtons.forEach((button) => {
			button.addEventListener('click', () => {
				const direction = button.dataset.sortDirection === 'asc' ? 'desc' : 'asc';
				sortPrograms(Number(button.dataset.programSortColumn), direction);
			});
		});
		mobileSort?.addEventListener('change', () => {
			const [column, direction] = mobileSort.value.split('-');
			sortPrograms(Number(column), direction);
		});

		const defaultFilter = programFilters.find((filter) => filter.dataset.programFilter === selectedFaculty) || programFilters[0];
		programBrowser.addEventListener('assessment-session', (event) => {
			const defaultFaculty = event.detail.signedIn ? programBrowser.dataset.defaultFaculty : 'all';
			selectFaculty(programFilters.find((filter) => filter.dataset.programFilter === defaultFaculty) || programFilters[0]);
		});
		defaultFilter?.click();
		sortPrograms(1, 'asc');
	}

});
