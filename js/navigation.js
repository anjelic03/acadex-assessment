document.addEventListener('DOMContentLoaded', () => {
	const body = document.body;
	try {
		body.classList.toggle('sidebar-collapsed', localStorage.getItem('acadex.assessment.sidebarCollapsed') === 'true');
		const width = Number(localStorage.getItem('acadex.assessment.sidebarWidth.app-drawer'));
		if (Number.isFinite(width) && width > 0) body.style.setProperty('--sidebar-custom-width', width + 'px');
	} catch {}
	const drawer = document.querySelector('[data-drawer]');
	const drawerToggle = document.querySelector('[data-drawer-toggle]');
	const drawerCloseTargets = document.querySelectorAll('[data-drawer-close], [data-drawer-link], [data-sign-out]');
	const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
	const sidebarResize = document.querySelector('[data-sidebar-resize]');
	const compactNavigation = window.matchMedia('(max-width: 900px)');
	let sidebarCollapsed = body.classList.contains('sidebar-collapsed');
	let drawerLastFocusedElement = null;

	const updateSidebarToggle = () => {
		if (!sidebarToggle) return;
		const expanded = compactNavigation.matches ? body.classList.contains('drawer-open') : !sidebarCollapsed;
		const label = compactNavigation.matches
			? (expanded ? 'Close navigation' : 'Open navigation')
			: (expanded ? 'Collapse sidebar' : 'Expand sidebar');
		sidebarToggle.setAttribute('aria-expanded', String(expanded));
		sidebarToggle.setAttribute('aria-label', label);
		sidebarToggle.setAttribute('title', label);
		sidebarResize?.setAttribute('aria-expanded', String(expanded));
		sidebarResize?.setAttribute('aria-label', label);
		sidebarResize?.setAttribute('title', label + ' or drag to resize');
	};

	const setSidebarCollapsed = (collapsed) => {
		if (sidebarCollapsed === collapsed) return;
		sidebarCollapsed = collapsed;
		body.classList.toggle('sidebar-collapsed', collapsed);
		updateSidebarToggle();
	};

	const saveSidebarCollapsed = () => {
		try {
			localStorage.setItem('acadex.assessment.sidebarCollapsed', String(sidebarCollapsed));
		} catch {}
	};

	const setDrawerState = (isOpen) => {
		if (!drawer || !drawerToggle) {
			return;
		}

		body.classList.toggle('drawer-open', isOpen);
		if (sidebarToggle) drawer.inert = compactNavigation.matches && !isOpen;
		drawerToggle.setAttribute('aria-expanded', String(isOpen));
		updateSidebarToggle();
		const screenReaderLabel = drawerToggle.querySelector('.sr-only');
		if (screenReaderLabel) {
			screenReaderLabel.textContent = isOpen ? 'Close navigation' : 'Open navigation';
		}

		if (isOpen) {
			drawer.querySelector('[data-drawer-link]')?.focus();
		} else if (drawerLastFocusedElement) {
			drawerLastFocusedElement.focus();
			drawerLastFocusedElement = null;
		}
	};

	if (sidebarToggle && drawer) {
		updateSidebarToggle();
		drawer.inert = compactNavigation.matches && !body.classList.contains('drawer-open');
		sidebarToggle.addEventListener('click', () => {
			if (compactNavigation.matches) {
				const isOpen = body.classList.contains('drawer-open');
				drawerLastFocusedElement = isOpen ? drawerLastFocusedElement : sidebarToggle;
				setDrawerState(!isOpen);
				return;
			}
			setSidebarCollapsed(!sidebarCollapsed);
			saveSidebarCollapsed();
		});
		compactNavigation.addEventListener('change', () => {
			if (drawer.contains(document.activeElement) || drawerLastFocusedElement) {
				drawerLastFocusedElement = sidebarToggle;
			}
			setDrawerState(false);
		});
	}

	if (sidebarResize && drawer) {
		const collapsedWidth = 68;
		const min = 140;
		const max = 320;
		const key = 'acadex.assessment.sidebarWidth.' + drawer.id;
		let drag;
		let suppressClick = false;
		let expandedWidth = 152;

		const setWidth = (value) => {
			expandedWidth = Math.max(min, Math.min(max, Math.round(value)));
			body.style.setProperty('--sidebar-custom-width', expandedWidth + 'px');
		};
		const saveWidth = () => {
			try {
				localStorage.setItem(key, String(expandedWidth));
			} catch {}
		};
		const finishResize = (cancelled) => {
			if (!drag) return;
			const { pointerId, width, resizing, wasCollapsed } = drag;
			drag = null;
			if (resizing) {
				if (cancelled) {
					setSidebarCollapsed(wasCollapsed);
				} else {
					if (!sidebarCollapsed) {
						setWidth(width);
						saveWidth();
					}
					saveSidebarCollapsed();
				}
			}
			body.classList.remove('is-resizing-sidebar');
			body.style.removeProperty('--sidebar-drag-width');
			if (sidebarResize.hasPointerCapture(pointerId)) sidebarResize.releasePointerCapture(pointerId);
		};
		const savedWidth = Number.parseFloat(body.style.getPropertyValue('--sidebar-custom-width'));
		if (Number.isFinite(savedWidth)) setWidth(savedWidth);

		sidebarResize.addEventListener('pointerdown', (event) => {
			if (!event.isPrimary || event.button !== 0 || compactNavigation.matches) return;
			suppressClick = false;
			const startWidth = drawer.getBoundingClientRect().width;
			drag = { pointerId: event.pointerId, startX: event.clientX, startWidth, wasCollapsed: sidebarCollapsed };
			sidebarResize.setPointerCapture(event.pointerId);
		});
		window.addEventListener('pointermove', (event) => {
			if (drag?.pointerId !== event.pointerId) return;
			const distance = event.clientX - drag.startX;
			if (!drag.resizing && Math.abs(distance) < 4) return;

			drag.resizing = suppressClick = true;
			drag.width = Math.max(collapsedWidth, Math.min(max, Math.round(drag.startWidth + distance)));
			body.classList.add('is-resizing-sidebar');
			body.style.setProperty('--sidebar-drag-width', drag.width + 'px');
			setSidebarCollapsed(drag.width < min);
		});
		window.addEventListener('pointerup', (event) => {
			if (drag?.pointerId === event.pointerId) finishResize(false);
		});
		window.addEventListener('pointercancel', (event) => {
			if (drag?.pointerId === event.pointerId) finishResize(true);
		});
		window.addEventListener('blur', () => finishResize(true));
		compactNavigation.addEventListener('change', () => finishResize(true));
		sidebarResize.addEventListener('click', (event) => {
			if (compactNavigation.matches || (suppressClick && event.detail > 0)) return;
			setSidebarCollapsed(!sidebarCollapsed);
			saveSidebarCollapsed();
		});

		sidebarResize.addEventListener('keydown', (event) => {
			if (compactNavigation.matches) return;
			const step = event.shiftKey ? 32 : 8;
			const widths = {
				ArrowLeft: sidebarCollapsed ? collapsedWidth : expandedWidth - step,
				ArrowRight: sidebarCollapsed ? min : expandedWidth + step,
				Home: min,
				End: max,
			};
			if (!Object.hasOwn(widths, event.key)) return;
			event.preventDefault();
			const width = widths[event.key];
			setSidebarCollapsed(width < min);
			if (!sidebarCollapsed) {
				setWidth(width);
				saveWidth();
			}
			saveSidebarCollapsed();
		});
	}

	drawerToggle?.addEventListener('click', () => {
		const isOpen = body.classList.contains('drawer-open');
		drawerLastFocusedElement = isOpen ? drawerLastFocusedElement : drawerToggle;
		setDrawerState(!isOpen);
	});

	drawerCloseTargets.forEach((target) => {
		target.addEventListener('click', (event) => {
			if (target.getAttribute('aria-current') === 'page') {
				event.preventDefault();
			}
			setDrawerState(false);
		});
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && body.classList.contains('drawer-open')) setDrawerState(false);
	});
});
