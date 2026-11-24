const strandFaculties = {
    STEM: ['FaCET', 'FALS', 'FNAHS'],
    ABM: ['FBM'],
    HUMSS: ['FHuSoCoM', 'FTED', 'FJCE'],
    GAS: ['FTED', 'FHuSoCoM', 'FBM'],
    TVL: ['FaCET', 'FBM', 'FALS'],
};
const interestKeywords = {
    BSIT: /coding|computer|game development|app development|web design|data science|programming/i,
    FaCET: /mathematics|physics|engineering|technical skills|numerical/i,
    FBM: /marketing|business|accounting|finance|entrepreneur|e-commerce/i,
    FALS: /biology|environment|gardening|chemistry/i,
    FNAHS: /healthcare|nutrition|biology|empathy/i,
    FHuSoCoM: /psychology|journalism|writing|communication|public speaking|community/i,
    FTED: /teaching|communication|leadership|performing arts/i,
    FJCE: /investigation|leadership|community|problem solving/i,
};
const subjectByFaculty = {
    FaCET: ['shs_grade_math', 'Mathematics grade'],
    FBM: ['shs_grade_math', 'Mathematics grade'],
    FALS: ['shs_grade_science', 'Science grade'],
    FNAHS: ['shs_grade_science', 'Science grade'],
};

// Demo scoring combines the selections and academic inputs into a repeatable ranking.
function rankAssessmentPrograms(assessment) {
    const preferences = assessment.preferred_courses ?? [];
    const interests = [...(assessment.interests ?? []), ...(assessment.strengths_skills ?? []), ...(assessment.hobbies ?? [])];
    const compatible = strandFaculties[assessment.shs_strand] ?? [];
    return window.assessmentPrograms.map((program) => {
        const factors = [];
        const preferredIndex = preferences.indexOf(program.code);
        const strandRank = compatible.indexOf(program.faculty_code);
        const [subject, subjectLabel] = subjectByFaculty[program.faculty_code] ?? ['shs_grade_english', 'English grade'];
        const interestPattern = interestKeywords[program.code] ?? interestKeywords[program.faculty_code];
        const interestCount = interests.filter((value) => interestPattern?.test(value)).length;
        const add = (label, value) => { if (value > 0) factors.push({ label, value }); };
        if (preferredIndex >= 0) add('Preferred program', 28 - preferredIndex * 6);
        if (strandRank >= 0) add('SHS strand', 18 - strandRank * 3);
        add('Interests and strengths', Math.min(20, interestCount * 7));
        add(subjectLabel, Math.round(Number(assessment[subject] || 0) * 0.18));
        add('SUAST percentile', Math.round(Number(assessment.suast_percentile || 0) * 0.12));
        return {
            code: program.code,
            score: Math.min(99, 36 + factors.reduce((sum, factor) => sum + factor.value, 0)),
            factors: factors.sort((a, b) => b.value - a.value).slice(0, 3),
        };
    }).sort((a, b) => b.score - a.score || a.code.localeCompare(b.code)).slice(0, 3);
}

function makeResultNode(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
}

function createRecommendationCard(match, rank, factorValues) {
    const program = window.assessmentPrograms.find(({ code }) => code === match.code);
    if (!program) return null;
    const type = program.board_course ? 'Board course' : 'Non-board course';
    const accent = ['gold', 'blue', 'coral'][rank - 1];
    const card = makeResultNode('button', `recommendation-card recommendation-card--${accent} recommendation-card--rank-${rank}`);
    card.type = 'button';
    card.dataset.recommendationRank = rank;
    card.dataset.courseName = program.name;
    card.dataset.recommendationOpen = '';
    card.addEventListener('click', () => openProgramDetails(program, match, card));

    const hero = makeResultNode('div', 'recommendation-hero');
    const height = 130 + match.score * 0.8;
    hero.style.setProperty('--recommendation-hero-height', height + 'px');
    hero.style.setProperty('--recommendation-hero-height-mobile', height / 2 + 'px');
    const scoreGroup = makeResultNode('div', 'recommendation-score-group');
    scoreGroup.append(makeResultNode('span', 'recommendation-score', match.score + '%'));
    hero.append(scoreGroup, makeResultNode('span', 'recommendation-type', type));

    const body = makeResultNode('div', 'recommendation-body');
    const title = makeResultNode('div', 'recommendation-title');
    title.append(makeResultNode('span', 'faculty-badge recommendation-badge', program.code), makeResultNode('h3', '', program.name));
    body.append(title, makeResultNode('p', 'recommendation-card__faculty', `${program.faculty} · ${program.faculty_code}`));
    const factors = makeResultNode('div', 'recommendation-factors');
    factors.append(makeResultNode('span', 'factors-title',
        match.factors.length ? 'Top Factors Driving This Recommendation' : 'Add academic details or interests for a more specific match.'));
    for (const factor of match.factors) {
        const row = makeResultNode('div', 'factor-row');
        const factorRank = Math.min(3, 1 + factorValues.filter((other) => other.label === factor.label && other.value > factor.value).length);
        const bar = makeResultNode('div', 'factor-bar factor-bar-rank-' + factorRank);
        const fill = document.createElement('span');
        fill.style.width = factor.value + '%';
        bar.append(fill);
        row.append(makeResultNode('span', 'factor-label', factor.label), bar, makeResultNode('span', 'factor-percent', factor.value + '%'));
        factors.append(row);
    }
    body.append(factors, makeResultNode('span', 'recommendation-card__detail', 'View course details'));
    card.append(hero, body);
    return card;
}

function buildRecommendationResults(run, profile) {
    const container = makeResultNode('div', 'recommendations-carousel');
    const track = makeResultNode('div', 'recommendations-grid');
    track.dataset.recommendationsTrack = '';
    track.setAttribute('aria-label', 'Recommended programs');
    track.tabIndex = 0;
    const factorValues = run.matches.flatMap((match) => match.factors);
    const cards = run.matches.map((match, rank) => createRecommendationCard(match, rank + 1, factorValues)).filter(Boolean);
    track.append(...cards);
    container.append(track);
    setupResultCarousel(track, cards);
    const actions = makeResultNode('div', 'history-share-actions');
    const share = makeResultNode('button', 'button button--navy recommendation-share__trigger', 'Share recommendation');
    share.type = 'button';
    share.setAttribute('aria-haspopup', 'dialog');
    share.setAttribute('aria-controls', 'shareRecommendation');
    share.addEventListener('click', () => openRecommendationShare(cards, profile, share));
    actions.append(share);
    container.append(actions);
    return container;
}

function setupResultCarousel(track, cards) {
    const dots = makeResultNode('div', 'recommendation-pagination');
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Choose a recommended program');
    const cardPosition = (card) => {
        const padding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const position = track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left - padding;
        return Math.max(0, Math.min(position, track.scrollWidth - track.clientWidth));
    };
    const buttons = cards.map((card, index) => {
        const button = makeResultNode('button', 'recommendation-pagination__dot');
        button.type = 'button';
        button.setAttribute('aria-label', `Show recommendation ${index + 1} of ${cards.length}: ${card.dataset.courseName}`);
        button.addEventListener('click', () => {
            const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
            track.scrollTo({ left: cardPosition(card), behavior });
        });
        return button;
    });
    dots.append(...buttons);
    track.after(dots);
    const sync = () => {
        dots.hidden = cards.length < 2 || track.scrollWidth <= track.clientWidth + 1 || !track.clientWidth;
        if (dots.hidden) return;
        const distances = cards.map((card) => Math.abs(track.scrollLeft - cardPosition(card)));
        const current = distances.indexOf(Math.min(...distances));
        buttons.forEach((button, index) => {
            if (index === current) button.setAttribute('aria-current', 'true');
            else button.removeAttribute('aria-current');
        });
    };
    track.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    track.releaseCarousel = () => observer.disconnect();
}

function releaseResultCarousels(container) {
    container.querySelectorAll('[data-recommendations-track]').forEach((track) => track.releaseCarousel());
}

function renderRecommendationResults(state) {
    const [latest, ...previous] = state.runs;
    if (!latest) return;
    const update = (key, value) => { document.querySelector(`[data-${key}]`).textContent = value; };
    update('saved-percentile', state.assessment?.suast_percentile || '—');
    update('assessment-metric', 'Results ready');
    const ring = document.querySelector('.metric-ring--steps');
    ring.classList.add('metric-ring--complete');
    ring.firstElementChild.textContent = '✓';
    update('recommendations-summary', 'These simulated results are based on your most recently saved assessment.');
    const top = latest.matches[0];
    const exploration = latest.matches.find(({ code }) => !latest.choices.includes(code));
    const explore = window.assessmentPrograms.find(({ code }) => code === exploration?.code);
    const overlap = latest.matches.map(({ code }) => code).filter((code) => latest.choices.includes(code));
    const strongest = top.factors[0];
    update('match-factor', strongest ? `${strongest.label} contributed to your simulated match for ${top.code}.` : `Open ${top.code} to review its match details.`);
    update('program-to-explore', explore ? `Explore ${explore.name}.` : 'All your recommendations are among your saved choices.');
    update('choice-match', overlap.length ? `Your saved choices include ${new Intl.ListFormat('en').format(overlap)}.`
        : latest.choices.length ? 'Your recommendations give you a different set of programs to explore.'
            : 'Add preferred programs in your assessment to compare them with your recommendations.');

    const available = document.querySelector('[data-available-results]');
    releaseResultCarousels(available);
    available.replaceChildren(buildRecommendationResults(latest, state.profile));
    document.querySelector('.recommendations-history-link').hidden = !previous.length;
    const history = document.querySelector('[data-history-list]');
    if (!previous.length) return;
    const dateFormat = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' });
    releaseResultCarousels(history);
    history.replaceChildren(...previous.map((run) => {
        const details = makeResultNode('details', 'history-run panel');
        const summary = document.createElement('summary');
        const timestamp = document.createElement('span');
        timestamp.append(makeResultNode('strong', '', dateFormat.format(new Date(run.date))),
            makeResultNode('small', '', 'Philippine time'));
        summary.append(timestamp);
        const results = buildRecommendationResults(run, state.profile);
        results.classList.add('history-recommendations');
        details.append(summary, results);
        return details;
    }));
}

function openProgramDetails(program, match, trigger) {
    const modal = document.querySelector('[data-course-detail-modal]');
    const set = (name, value) => { modal.querySelector(`[data-course-detail-${name}]`).textContent = value; };
    const factorNames = match.factors.map((factor) => factor.label);
    set('name', program.name);
    set('code', program.code);
    set('description', program.description || 'No description available.');
    set('rationale', factorNames.length ? `This simulation considered ${new Intl.ListFormat('en').format(factorNames)}.`
        : 'Add details to your assessment to see which inputs contribute to this simulated match.');
    set('faculty', program.faculty);
    set('score', match.score + '%');
    set('type', program.board_course ? 'Board course' : 'Non-board course');
    set('top-factor', factorNames[0] ?? 'Factor unavailable');
    set('supporting-factor', factorNames[1] ?? '');
    modal.querySelector('[data-course-supporting-factor-card]').hidden = factorNames.length < 2;
    modal.querySelector('[data-course-detail-personal-section]').hidden = !factorNames.length;
    modal.querySelector('[data-course-detail-personal-factors]').replaceChildren(...match.factors.map(({ label, value }) => {
        const row = document.createElement('li');
        const bar = makeResultNode('span', 'course-detail-factor-graph__track');
        bar.setAttribute('aria-hidden', 'true');
        bar.style.setProperty('--factor-weight', value + '%');
        row.append(makeResultNode('span', '', label), makeResultNode('strong', '', value + '%'), bar);
        return row;
    }));

    const close = modal.querySelector('[data-course-detail-close]');
    const shell = document.querySelector('.app-shell');
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const dismiss = () => {
        listeners.abort();
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        shell.inert = false;
        document.body.classList.remove('modal-open');
        trigger.focus();
    };
    close.addEventListener('click', dismiss, options);
    modal.addEventListener('click', (event) => { if (event.target === modal) dismiss(); }, options);
    modal.addEventListener('keydown', (event) => {
        keepFocusInOverlay(event, modal);
        if (event.key === 'Escape') dismiss();
    }, options);
    window.addEventListener('hashchange', dismiss, options);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    shell.inert = true;
    document.body.classList.add('modal-open');
    close.focus();
}

function openRecommendationShare(cards, profile, trigger) {
    if (!cards.length) return;
    const dialog = document.getElementById('shareRecommendation');
    const caption = dialog.querySelector('[data-share-caption]');
    const preview = dialog.querySelector('[data-share-preview]');
    const status = dialog.querySelector('[data-share-status]');
    const native = dialog.querySelector('[data-share-native]');
    const download = dialog.querySelector('[data-share-download]');
    const title = `Top ${cards.length} recommended programs for ${profile.first_name}`;
    const matches = cards.map((card) => `${card.dataset.courseName} (${card.querySelector('.recommendation-score').textContent} match)`);
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let snapshotUrl;
    let file;

    caption.value = [title, ...matches, '', 'Simulated ACADEX assessment results'].join('\n');
    native.hidden = typeof navigator.share !== 'function';
    download.disabled = true;
    status.textContent = '';
    preview.replaceChildren(makeResultNode('p', '', 'Preparing dashboard snapshot…'));
    dialog.showModal();

    exportRecommendationSnapshot(cards, title).then((blob) => {
        if (listeners.signal.aborted) return;
        snapshotUrl = URL.createObjectURL(blob);
        file = new File([blob], 'acadex-recommendations.png', { type: 'image/png' });
        const image = new Image();
        image.src = snapshotUrl;
        image.alt = 'Dashboard snapshot of the simulated recommendations';
        preview.replaceChildren(image);
        download.disabled = false;
    }).catch(() => {
        if (!listeners.signal.aborted) preview.textContent = 'The snapshot could not be prepared. You can still copy the caption.';
    });

    dialog.addEventListener('close', () => {
        listeners.abort();
        if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
        trigger.focus();
    }, options);
    dialog.querySelector('[data-share-copy]').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(caption.value);
            status.textContent = 'Caption copied.';
        } catch {
            caption.focus();
            caption.select();
            status.textContent = 'Use your device’s Copy command to copy the selected caption.';
        }
    }, options);
    download.addEventListener('click', () => {
        if (!snapshotUrl) return;
        const link = document.createElement('a');
        link.href = snapshotUrl;
        link.download = file.name;
        dialog.append(link);
        link.click();
        link.remove();
        status.textContent = 'Download started.';
    }, options);
    native.addEventListener('click', async () => {
        try {
            const post = { title, text: caption.value };
            if (file && navigator.canShare?.({ files: [file] })) post.files = [file];
            await navigator.share(post);
        } catch (error) {
            if (error.name !== 'AbortError') status.textContent = 'Sharing is unavailable. Copy the caption or download the image.';
        }
    }, options);
}
