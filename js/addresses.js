const addressFieldNames = ['province', 'city', 'barangay'];
let addressReference;

function loadAddressReference() {
    if (!addressReference) {
        const datasets = ['provinces', 'cities', 'barangays'];
        addressReference = location.protocol === 'file:'
            ? new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'js/address-data.js';
                script.onload = () => resolve(window.assessmentAddresses);
                script.onerror = () => reject(new Error('The local address data could not be opened.'));
                document.head.append(script);
            })
            : Promise.all(datasets.map(async (name) => {
                const response = await fetch(`database/data/${name}.json`);
                if (!response.ok) throw new Error(`Could not load ${name}.`);
                const records = await response.json();
                if (!Array.isArray(records)) throw new Error(`Invalid ${name} data.`);
                return [name, records];
            })).then(Object.fromEntries);
    }
    return addressReference;
}

function setupAddressFields(container) {
    const [province, city, barangay] = addressFieldNames.map((name) =>
        container.querySelector(`[data-address-${name}]`));
    const fields = [province, city, barangay];
    const status = document.createElement('p');
    status.className = 'auth-field-error';
    status.setAttribute('role', 'status');
    status.hidden = true;
    container.after(status);

    let data;
    let savedAddress = {};
    const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase();

    function setOptions(select, records, labelKey, codeKey, selectedValue) {
        const placeholder = select.options[0];
        const options = records.map((record) => {
            const option = new Option(record[labelKey], record[labelKey]);
            option.dataset.code = record[codeKey];
            return option;
        });
        select.replaceChildren(placeholder, ...options);
        const saved = options.find((option) => normalize(option.value) === normalize(selectedValue));
        select.value = saved?.value ?? '';
        select.disabled = options.length === 0;
    }

    function renderBarangays(selected = {}) {
        const code = city.selectedOptions[0]?.dataset.code;
        const records = data.barangays.filter((row) => String(row.citymun_code) === code);
        setOptions(barangay, records, 'brgy_desc', 'brgy_code', selected.barangay);
    }

    function renderCities(selected = {}) {
        const code = province.selectedOptions[0]?.dataset.code;
        const records = data.cities.filter((row) => String(row.prov_code) === code);
        setOptions(city, records, 'citymun_desc', 'citymun_code', selected.city);
        renderBarangays(selected);
    }

    function render() {
        setOptions(province, data.provinces, 'prov_desc', 'prov_code', savedAddress.province);
        renderCities(savedAddress);
    }

    fields.forEach((field) => { field.disabled = true; });
    const loading = loadAddressReference().then((reference) => {
        data = reference;
        render();
        province.addEventListener('change', () => renderCities());
        city.addEventListener('change', () => renderBarangays());
    }).catch(() => {
        status.textContent = 'Address options could not load. Reload this page to try again.';
        status.hidden = false;
    });

    return {
        ready: loading.then(() => Boolean(data)),
        set(address) {
            savedAddress = address;
            if (data) render();
        },
        values() {
            if (!data) return { ...savedAddress };
            return Object.fromEntries(fields.map((field) => [field.name, field.value]));
        },
    };
}
