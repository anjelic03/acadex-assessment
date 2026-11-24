const assessmentStorageKey = 'acadex.assessment.simulation.v1';
const demoProfile = {
    first_name: 'Alex',
    middle_name: '',
    last_name: 'Reyes',
    suffix: 'N/A',
    birthdate: '2007-06-15',
    gender: 'Female',
    email: 'alex@example.com',
    province: '',
    city: '',
    barangay: '',
};
const profileFields = {
    assessmentFirstName: 'first_name',
    assessmentMiddleName: 'middle_name',
    assessmentLastName: 'last_name',
    assessmentSuffix: 'suffix',
    assessmentBirthdate: 'birthdate',
    assessmentGender: 'gender',
};

function readSimulation() {
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(assessmentStorageKey));
    } catch {}
    return {
        profile: { ...demoProfile, ...saved?.profile },
        assessment: saved?.assessment ?? null,
        runs: Array.isArray(saved?.runs) ? saved.runs : [],
        signedIn: saved?.signedIn ?? true,
    };
}

function saveSimulation(state) {
    try {
        localStorage.setItem(assessmentStorageKey, JSON.stringify(state));
        return true;
    } catch {
        return false;
    }
}

function populateAssessmentOptions() {
    document.querySelectorAll('select[data-options]').forEach((select) => {
        const key = select.dataset.options;
        const values = key === 'programs'
            ? window.assessmentPrograms.map(({ code, name }) => ({ value: code, label: `${code} · ${name}` }))
            : window.assessmentOptions[key];
        values.forEach((option) => {
            select.add(typeof option === 'string' ? new Option(option, option) : new Option(option.label, option.value));
        });
    });

    document.querySelectorAll('[data-checkbox-options]').forEach((group) => {
        const key = group.dataset.checkboxOptions;
        window.assessmentOptions[key].forEach((value) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = key + '[]';
            input.value = value;
            label.append(input, ' ' + value);
            group.append(label);
        });
    });
}

function setupMultiSelects(form) {
    const widgets = [...form.querySelectorAll('.legacy-multi-select')].map((select) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'legacy-choice-select';
        const trigger = document.createElement('button');
        trigger.className = 'legacy-choice-select__trigger';
        trigger.type = 'button';
        trigger.id = select.id + 'Trigger';
        const fieldLabel = select.labels[0];
        fieldLabel.htmlFor = trigger.id;
        fieldLabel.id = select.id + 'Label';
        trigger.setAttribute('aria-labelledby', `${fieldLabel.id} ${trigger.id}`);
        const summary = document.createElement('span');
        const chevron = document.createElement('i');
        chevron.setAttribute('aria-hidden', 'true');
        trigger.append(summary, chevron);

        const menu = document.createElement('div');
        menu.className = 'legacy-choice-select__menu';
        menu.id = select.id + 'Options';
        menu.setAttribute('role', 'group');
        menu.setAttribute('aria-labelledby', fieldLabel.id);
        trigger.setAttribute('aria-controls', menu.id);

        const sync = () => {
            fields.forEach(([input, option]) => { input.checked = option.selected; });
            summary.textContent = [...select.selectedOptions].map((option) => option.text).join(', ') || 'Select';
        };
        const fields = [...select.options].map((option) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            const text = document.createElement('span');
            input.type = 'checkbox';
            text.textContent = option.text;
            input.addEventListener('change', () => {
                option.selected = input.checked;
                sync();
            });
            label.append(input, text);
            menu.append(label);
            return [input, option];
        });

        const setOpen = (open) => {
            menu.hidden = !open;
            trigger.setAttribute('aria-expanded', String(open));
        };
        trigger.addEventListener('click', () => {
            const shouldOpen = menu.hidden;
            closeMenus();
            setOpen(shouldOpen);
        });
        setOpen(false);
        select.hidden = true;
        wrapper.append(trigger, menu);
        select.before(wrapper);
        sync();
        return { menu, trigger, sync, setOpen };
    });

    function closeMenus(restoreFocus = false) {
        const active = widgets.find((widget) => !widget.menu.hidden);
        if (!active) return false;
        active.setOpen(false);
        if (restoreFocus) active.trigger.focus();
        return true;
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.legacy-choice-select')) closeMenus();
    });
    return { closeMenus, sync: () => widgets.forEach((widget) => widget.sync()) };
}

function formValues(form) {
    const data = new FormData(form);
    const entries = {};
    for (const [key, value] of data) {
        if (key.endsWith('[]')) {
            if (value) (entries[key.slice(0, -2)] ??= []).push(value);
        } else {
            entries[key] = value;
        }
    }
    return entries;
}

function setFormValues(form, values) {
    let preferredIndex = 0;
    for (const field of form.elements) {
        if (!field.name || field.hasAttribute('data-address-province')
            || field.hasAttribute('data-address-city') || field.hasAttribute('data-address-barangay')) continue;
        const saved = values[field.name.replace(/\[\]$/, '')];
        if (field.name === 'preferred_courses[]') {
            field.value = saved?.[preferredIndex++] ?? '';
        } else if (field.multiple) {
            [...field.options].forEach((option) => { option.selected = (saved ?? []).includes(option.value); });
        } else if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = Array.isArray(saved) ? saved.includes(field.value) : saved === field.value || (saved === undefined && field.defaultChecked);
        } else {
            field.value = saved ?? '';
        }
    }
}

function showFeedback(element, message) {
    element.textContent = message;
    element.hidden = !message;
}

function incompleteGroup(form, names) {
    const fields = names.map((name) => form.elements.namedItem(name));
    return fields.some((field) => field.value !== '') ? fields.find((field) => field.value === '') : null;
}

function keepFocusInOverlay(event, overlay) {
    if (event.key !== 'Tab') return;
    const controls = [...overlay.querySelectorAll('button, input, select, textarea, a[href]')]
        .filter((ctrl) => !ctrl.disabled && ctrl.tabIndex >= 0 && ctrl.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateAssessmentOptions();
    const state = readSimulation();
    const modal = document.getElementById('assessmentModal');
    const shell = document.querySelector('.app-shell');
    const form = modal.querySelector('[data-assessment-form]');
    const steps = [...form.querySelectorAll('[data-wizard-step]')];
    const progress = [...modal.querySelectorAll('[data-wizard-jump]')];
    const close = modal.querySelector('[data-assessment-close]');
    const next = modal.querySelector('[data-wizard-next]');
    const back = modal.querySelector('[data-wizard-back]');
    const counter = modal.querySelector('[data-wizard-counter]');
    const title = modal.querySelector('[data-assessment-title]');
    const consent = modal.querySelector('[data-privacy-consent]');
    const error = modal.querySelector('[data-assessment-error]');
    const status = document.querySelector('[data-assessment-status]');
    const profileForm = document.querySelector('[data-profile-form]');
    const profileStatus = document.querySelector('[data-profile-status]');
    const multiSelects = setupMultiSelects(form);
    const assessmentAddress = setupAddressFields(form.querySelector('[data-address-selects]'));
    const profileAddress = setupAddressFields(profileForm.querySelector('[data-address-selects]'));
    const routes = new Map([...document.querySelectorAll('[data-view]')].map((page) => [page.dataset.view, page]));
    const sidebarLinks = [...document.querySelectorAll('.sidebar-nav a')];
    const programBrowser = document.querySelector('[data-program-browser]');
    const manilaDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const date = Object.fromEntries(manilaDate.map(({ type, value }) => [type, value]));
    profileForm.elements.birthdate.max = `${date.year}-${date.month}-${date.day}`;
    let index = 0;
    let opener;
    let activeRoute;
    let visibleSession;
    let autoOpened = false;
    let saving = false;

    const firstStep = () => state.assessment ? 1 : 0;
    const lastStep = steps.length - 1;
    const labelStep = (number) => String(number).padStart(2, '0');
    const addressFromProfile = () => Object.fromEntries(addressFieldNames.map((name) => [name, state.profile[name]]));

    function renderProfile() {
        setFormValues(profileForm, state.profile);
        profileAddress.set(addressFromProfile());
        document.querySelectorAll('[data-student-name]').forEach((name) => { name.textContent = state.profile.first_name; });
        Object.entries(profileFields).forEach(([id, name]) => { document.getElementById(id).value = state.profile[name]; });
    }

    function resetAssessment() {
        const address = addressFromProfile();
        setFormValues(form, { ...state.assessment, data_privacy_consent: state.assessment ? '1' : undefined });
        assessmentAddress.set({ ...address, province: address.province || (state.assessment ? '' : 'DAVAO ORIENTAL') });
        multiSelects.sync();
    }

    function renderWizard() {
        const start = firstStep();
        steps.forEach((step, stepIndex) => {
            step.hidden = stepIndex !== index;
            step.classList.toggle('is-active', stepIndex === index);
        });
        progress.forEach((item, stepIndex) => {
            item.hidden = stepIndex < start;
            item.classList.toggle('is-active', stepIndex === index);
            if (stepIndex === index) item.setAttribute('aria-current', 'step');
            else item.removeAttribute('aria-current');
            item.disabled = start === 0 && stepIndex > 0 && !consent.checked;
            item.querySelector('span').textContent = labelStep(stepIndex - start + 1);
        });
        back.disabled = index === start;
        next.disabled = saving || (index === 0 && !consent.checked);
        next.type = index === lastStep ? 'submit' : 'button';
        next.textContent = saving ? next.dataset.pendingLabel : index === lastStep ? 'Finish assessment' : 'Next';
        counter.textContent = `Step ${labelStep(index - start + 1)} of ${labelStep(steps.length - start)}`;
        title.textContent = progress[index].dataset.wizardLabel;
    }

    function goToStep(stepIndex) {
        index = stepIndex;
        multiSelects.closeMenus();
        showFeedback(error, '');
        renderWizard();
        steps[index].scrollTop = 0;
    }

    function openAssessment() {
        if (!modal.hidden || !state.signedIn) return;
        opener = document.activeElement;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        shell.inert = true;
        goToStep(firstStep());
        close.focus();
    }

    function closeAssessment({ restoreFocus = true } = {}) {
        if (modal.hidden) return;
        multiSelects.closeMenus();
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        shell.inert = false;
        document.body.classList.remove('modal-open');
        if (restoreFocus) opener?.focus();
        opener = null;
    }

    function reportField(field, message = field.validationMessage) {
        const stepIndex = steps.indexOf(field.closest('[data-wizard-step]'));
        if (stepIndex !== index) goToStep(stepIndex);
        showFeedback(error, message);
        field.focus();
        return false;
    }

    function validateStep(stepIndex) {
        const invalid = [...steps[stepIndex].querySelectorAll('input, select')]
            .find((field) => field.willValidate && !field.validity.valid);
        if (invalid) return reportField(invalid);
        if (stepIndex === 2) {
            const field = incompleteGroup(form, ['suast_percentile', 'suast_stanine', 'suast_result_index']);
            if (field) return reportField(field, 'Enter all three SUAST values or clear the SUAST section.');
        }
        if (stepIndex === 1) {
            const field = incompleteGroup(form, addressFieldNames);
            if (field) return reportField(field, 'Choose a province, city or municipality, and barangay, or clear the province.');
        }
        return true;
    }

    function showRoute({ focus = false } = {}) {
        const hash = location.hash.slice(1);
        const requested = routes.has(hash) ? hash : 'dashboard';
        const page = state.signedIn ? requested : 'home';
        if (page !== activeRoute) {
            closeAssessment({ restoreFocus: false });
            routes.forEach((element, key) => { element.hidden = key !== page; });
            shell.dataset.page = page === 'history' ? 'dashboard' : page;
            const title = page === 'history' ? 'Recommendation history' : page[0].toUpperCase() + page.slice(1);
            document.title = title + ' | ACADEX';
            sidebarLinks.forEach((link) => {
                const selected = link.hash === '#' + shell.dataset.page;
                link.classList.toggle('is-active', selected);
                if (link.hash === '#' + page) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            window.scrollTo({ top: 0, behavior: 'instant' });
            if (focus) document.getElementById('main-content').focus({ preventScroll: true });
            activeRoute = page;
        }
        if (state.signedIn !== visibleSession) {
            document.querySelector('[data-account-panel]').hidden = !state.signedIn;
            document.querySelector('[data-guest-panel]').hidden = state.signedIn;
            document.querySelector('.home-hero-cta').hidden = state.signedIn;
            programBrowser.dispatchEvent(new CustomEvent('assessment-session', { detail: { signedIn: state.signedIn } }));
            visibleSession = state.signedIn;
        }
        if (!autoOpened && page === 'dashboard' && new URLSearchParams(location.search).get('assessment') === '1') {
            autoOpened = true;
            openAssessment();
        }
    }

    function navigate(page) {
        if (location.hash === '#' + page) showRoute({ focus: true });
        else location.hash = page;
    }

    function startDemo() {
        state.signedIn = true;
        saveSimulation(state);
        navigate('profile');
    }

    document.querySelector('.skip-link').addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('main-content').focus();
    });
    window.addEventListener('hashchange', () => showRoute({ focus: true }));
    document.querySelectorAll('[data-sign-in]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            startDemo();
        });
    });
    sidebarLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            if (!state.signedIn && link.hash !== '#home') {
                event.preventDefault();
                startDemo();
            }
        });
    });
    document.querySelector('[data-sign-out]').addEventListener('click', () => {
        state.signedIn = false;
        saveSimulation(state);
        profileForm.reset();
        showFeedback(profileStatus, '');
        showFeedback(status, '');
        renderProfile();
        resetAssessment();
        navigate('home');
    });

    profileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const missing = incompleteGroup(profileForm, addressFieldNames);
        if (missing) {
            showFeedback(profileStatus, 'Choose a complete address or clear the province.');
            missing.focus();
            return;
        }
        Object.assign(state.profile, formValues(profileForm), profileAddress.values());
        const persisted = saveSimulation(state);
        renderProfile();
        const address = addressFromProfile();
        assessmentAddress.set({ ...address, province: address.province || (state.assessment ? '' : 'DAVAO ORIENTAL') });
        showFeedback(profileStatus, persisted ? 'Profile updated.' : 'Profile updated for this session. Browser storage is unavailable.');
    });

    document.querySelector('[data-assessment-open]').addEventListener('click', openAssessment);
    close.addEventListener('click', () => closeAssessment());
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeAssessment();
    });
    modal.addEventListener('keydown', (event) => {
        keepFocusInOverlay(event, modal);
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        if (!multiSelects.closeMenus(true)) closeAssessment();
    });
    consent.addEventListener('change', renderWizard);
    form.addEventListener('input', () => showFeedback(error, ''));
    back.addEventListener('click', () => goToStep(index - 1));
    next.addEventListener('click', (event) => {
        if (index === lastStep) return;
        event.preventDefault();
        if (validateStep(index)) {
            goToStep(index + 1);
            steps[index].querySelector('input:enabled, select:enabled, button:enabled')?.focus({ preventScroll: true });
        }
    });
    progress.forEach((button, stepIndex) => button.addEventListener('click', () => {
        if (stepIndex <= index || validateStep(index)) goToStep(stepIndex);
    }));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (index !== lastStep || saving) return;
        for (let stepIndex = firstStep(); stepIndex <= lastStep; stepIndex++) {
            if (!validateStep(stepIndex)) return;
        }
        saving = true;
        renderWizard();
        try {
            await assessmentAddress.ready;
            if (modal.hidden || !state.signedIn) return;
            if (!validateStep(1)) return;
            const address = assessmentAddress.values();
            const result = { ...formValues(form), ...(address.province ? address : addressFromProfile()), data_privacy_consent: '1' };
            if (JSON.stringify(state.assessment) === JSON.stringify(result)) {
                showFeedback(status, 'Assessment unchanged. Your current course recommendations are still up to date.');
            } else {
                const choices = result.preferred_courses ?? [];
                const run = { date: new Date().toISOString(), choices, matches: rankAssessmentPrograms(result) };
                if (address.province) Object.assign(state.profile, address);
                state.assessment = result;
                state.runs = [run, ...state.runs];
                const persisted = saveSimulation(state);
                renderProfile();
                resetAssessment();
                renderRecommendationResults(state);
                showFeedback(status, persisted ? 'Assessment saved. Your simulated course recommendations are ready.'
                    : 'Your simulated recommendations are ready for this session. Browser storage is unavailable.');
            }
            closeAssessment();
        } finally {
            saving = false;
            if (!modal.hidden) renderWizard();
        }
    });

    renderProfile();
    resetAssessment();
    renderRecommendationResults(state);
    showRoute();
});
