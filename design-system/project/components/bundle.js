/* @ds-bundle: {"format":4,"namespace":"SongQuiz","components":[{"name":"Window"},{"name":"Toolbar"},{"name":"Transport"},{"name":"VolumeSlider"},{"name":"LcdDisplay"},{"name":"SegmentedControl"},{"name":"SearchField"},{"name":"Button"},{"name":"SourceList"},{"name":"AlbumGrid"},{"name":"AlbumTile"},{"name":"NowPlaying"},{"name":"Leaderboard"},{"name":"Badge"},{"name":"StatusBar"},{"name":"Icon"}]} */
var SongQuiz = (function(exports, react) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	react = __toESM(react, 1);
	//#region design-system/project/components/src/utils.ts
	/** Joins the truthy class names with spaces. */
	function cx(...names) {
		return names.filter(Boolean).join(" ");
	}
	/** Controlled when `value` is given, otherwise keeps its own state. */
	function useMaybeControlled(value, initial, onChange) {
		const [inner, setInner] = (0, react.useState)(initial);
		const controlled = value !== void 0 && value !== null;
		const current = controlled ? value : inner;
		const set = (next) => {
			if (!controlled) setInner(next);
			onChange?.(next);
		};
		return [current, set];
	}
	/** Seconds as m:ss; negative numbers get a leading minus ("-0:18"). */
	function formatTime(seconds) {
		const negative = seconds < 0;
		const total = Math.abs(Math.round(seconds));
		const m = Math.floor(total / 60);
		const s = total % 60;
		return (negative ? "-" : "") + m + ":" + (s < 10 ? "0" : "") + s;
	}
	//#endregion
	//#region build/jsx-runtime-global.ts
	var Fragment = react.Fragment;
	function jsx(type, props, key) {
		return react.createElement(type, key === void 0 ? props : {
			...props,
			key
		});
	}
	var jsxs = jsx;
	//#endregion
	//#region design-system/project/components/src/Icon.tsx
	var ICONS = {
		play: [["f", "M5 3.25v9.5L12.75 8z"]],
		pause: [["f", "M4.25 3h2.75v10H4.25zM9 3h2.75v10H9z"]],
		prev: [["f", "M8 4v8L2.25 8zM14 4v8L8.25 8z"]],
		next: [["f", "M2 4v8l5.75-4zM8 4v8l5.75-4z"]],
		"volume-low": [["f", "M2 6h2.5L8 3v10L4.5 10H2z"]],
		"volume-high": [
			["f", "M1.5 6H4l3.5-3v10L4 10H1.5z"],
			[
				"s",
				"M10 5.5a3.5 3.5 0 0 1 0 5",
				1.4
			],
			[
				"s",
				"M12 3.5a6.4 6.4 0 0 1 0 9",
				1.4
			]
		],
		search: [[
			"s",
			"M10.5 6.5a4 4 0 1 1-8 0a4 4 0 1 1 8 0",
			1.7
		], [
			"s",
			"M9.5 9.5l4 4",
			2
		]],
		plus: [["f", "M7 2.5h2v4.5h4.5v2H9v4.5H7V9H2.5V7H7z"]],
		shuffle: [
			[
				"s",
				"M2 4.5h2.2c3.2 0 4.2 7 7.4 7H13",
				1.5
			],
			[
				"s",
				"M2 11.5h2.2c1.3 0 2.1-1.2 2.8-2.7",
				1.5
			],
			[
				"s",
				"M9 6.6c.7-1.2 1.4-2.1 2.6-2.1H13",
				1.5
			],
			["f", "M12.5 2.25l3 2.25-3 2.25z"],
			["f", "M12.5 9.25l3 2.25-3 2.25z"]
		],
		repeat: [
			[
				"s",
				"M2.75 9V6.75a2 2 0 0 1 2-2H12",
				1.5
			],
			[
				"s",
				"M13.25 7v2.25a2 2 0 0 1-2 2H4",
				1.5
			],
			["f", "M11.5 2.25l3 2.5-3 2.5z"],
			["f", "M4.5 8.75l-3 2.5 3 2.5z"]
		],
		music: [["f", "M6 3.6l7-1.6v8.4a2.1 2.1 0 1 1-1.5-2V4.7L7.5 5.7v6.2a2.1 2.1 0 1 1-1.5-2z"]],
		playlist: [["f", "M1.5 3h9v1.6h-9zM1.5 6.4h9V8h-9zM1.5 9.8h5.5v1.6H1.5z"], ["f", "M11.5 6.2L15 5.4v1.7l-2 .45v4.6a1.75 1.75 0 1 1-1.5-1.73z"]],
		user: [["f", "M10.75 5.25a2.75 2.75 0 1 1-5.5 0a2.75 2.75 0 1 1 5.5 0"], ["f", "M2.5 14c0-3 2.4-5 5.5-5s5.5 2 5.5 5z"]],
		users: [
			["f", "M8.25 5a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 1 1 4.5 0"],
			["f", "M1 13.5c0-2.6 2-4.3 5-4.3s5 1.7 5 4.3z"],
			["f", "M13.5 5.5a2 2 0 1 1-4 0a2 2 0 1 1 4 0"],
			["f", "M12 13.5h3.5c0-2.3-1.5-3.8-3.9-3.9c.9.9 1.4 2.2 1.6 3.9z"]
		],
		trophy: [
			["f", "M4.5 2h7v3.5a3.5 3.5 0 0 1-7 0z"],
			[
				"s",
				"M4.5 3.25H2.5v1a2.25 2.25 0 0 0 2.25 2.25",
				1.3
			],
			[
				"s",
				"M11.5 3.25h2v1a2.25 2.25 0 0 1-2.25 2.25",
				1.3
			],
			["f", "M7.25 9h1.5v2.5H11V14H5v-2.5h2.25z"]
		],
		check: [[
			"s",
			"M3 8.5l3.2 3L13 4.5",
			2.2
		]],
		cross: [[
			"s",
			"M4 4l8 8M12 4l-8 8",
			2.2
		]],
		clock: [[
			"s",
			"M14 8a6 6 0 1 1-12 0a6 6 0 1 1 12 0",
			1.5
		], [
			"s",
			"M8 4.5V8l2.5 1.5",
			1.5
		]],
		list: [["f", "M2 3h12v2.25H2zM2 6.9h12v2.25H2zM2 10.75h12V13H2z"]],
		grid: [["f", "M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"]],
		disclosure: [["f", "M5 3.5l6 4.5-6 4.5z"]],
		"disclosure-down": [["f", "M3.5 5h9L8 11z"]],
		broadcast: [
			["f", "M9.5 8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0"],
			[
				"s",
				"M5.2 5.2a4 4 0 0 0 0 5.6M10.8 5.2a4 4 0 0 1 0 5.6",
				1.4
			],
			[
				"s",
				"M3.1 3.1a7 7 0 0 0 0 9.8M12.9 3.1a7 7 0 0 1 0 9.8",
				1.4
			]
		]
	};
	/** Every glyph name, in display order. */
	var iconNames = Object.keys(ICONS);
	function Icon({ name, size = 16, title, className, style }) {
		const parts = ICONS[name] ?? [];
		return /* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 16 16",
			width: size,
			height: size,
			focusable: "false",
			className: cx("sq-icon", className),
			style,
			role: title ? "img" : void 0,
			"aria-hidden": title ? void 0 : true,
			children: [title ? /* @__PURE__ */ jsx("title", { children: title }) : null, parts.map((p, i) => p[0] === "f" ? /* @__PURE__ */ jsx("path", {
				d: p[1],
				fill: "currentColor"
			}, i) : /* @__PURE__ */ jsx("path", {
				d: p[1],
				fill: "none",
				stroke: "currentColor",
				strokeWidth: p[2] ?? 1.6,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}, i))]
		});
	}
	//#endregion
	//#region design-system/project/components/src/Window.tsx
	function Window({ title, toolbar, sidebar, statusBar, children, onClose, closeLabel = "Leave room", className, style }) {
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-window", className),
			style,
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "sq-window-head",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "sq-titlebar",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "sq-dots",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "sq-dot sq-dot-close",
									"aria-label": closeLabel,
									onClick: onClose
								}),
								/* @__PURE__ */ jsx("i", {
									className: "sq-dot sq-dot-minimize",
									"aria-hidden": true
								}),
								/* @__PURE__ */ jsx("i", {
									className: "sq-dot sq-dot-zoom",
									"aria-hidden": true
								})
							]
						}), /* @__PURE__ */ jsx("div", {
							className: "sq-title",
							children: title
						})]
					}), toolbar ? /* @__PURE__ */ jsx("div", {
						className: "sq-window-toolbar",
						children: toolbar
					}) : null]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "sq-window-main",
					children: [sidebar ? /* @__PURE__ */ jsx("aside", {
						className: "sq-window-sidebar",
						children: sidebar
					}) : null, /* @__PURE__ */ jsx("div", {
						className: "sq-window-content",
						children
					})]
				}),
				statusBar ?? null
			]
		});
	}
	function Toolbar({ start, center, end, className }) {
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-toolbar", className),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "sq-toolbar-start",
					children: start
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-toolbar-center",
					children: center
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-toolbar-end",
					children: end
				})
			]
		});
	}
	//#endregion
	//#region design-system/project/components/src/Playback.tsx
	var TRANSPORT_LABELS = {
		play: "Play",
		pause: "Pause",
		prev: "Replay snippet",
		next: "Skip"
	};
	function TransportButton({ icon = "play", size = "md", label, onClick, disabled, className }) {
		return /* @__PURE__ */ jsx("button", {
			type: "button",
			disabled,
			onClick,
			className: cx("sq-transport-btn", "sq-transport-" + size, className),
			"aria-label": label ?? TRANSPORT_LABELS[icon],
			children: /* @__PURE__ */ jsx(Icon, {
				name: icon,
				size: size === "lg" ? 18 : 13
			})
		});
	}
	function Transport({ playing = false, onPrevious, onToggle, onNext, disabled, className }) {
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-transport", className),
			role: "group",
			"aria-label": "Playback",
			children: [
				/* @__PURE__ */ jsx(TransportButton, {
					icon: "prev",
					onClick: onPrevious,
					disabled
				}),
				/* @__PURE__ */ jsx(TransportButton, {
					icon: playing ? "pause" : "play",
					size: "lg",
					onClick: onToggle,
					disabled
				}),
				/* @__PURE__ */ jsx(TransportButton, {
					icon: "next",
					onClick: onNext,
					disabled
				})
			]
		});
	}
	function VolumeSlider({ value, defaultValue = 70, onChange, min = 0, max = 100, label = "Volume", disabled, className }) {
		const [current, setCurrent] = useMaybeControlled(value, defaultValue, onChange);
		const pct = (current - min) / (max - min) * 100;
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-volume", className),
			children: [
				/* @__PURE__ */ jsx(Icon, {
					name: "volume-low",
					size: 12
				}),
				/* @__PURE__ */ jsx("input", {
					type: "range",
					min,
					max,
					value: current,
					className: "sq-volume-range",
					"aria-label": label,
					disabled,
					style: { "--sq-fill": pct + "%" },
					onChange: (e) => setCurrent(Number(e.target.value))
				}),
				/* @__PURE__ */ jsx(Icon, {
					name: "volume-high",
					size: 12
				})
			]
		});
	}
	function LcdDisplay({ title, subtitle, progress, elapsed, remaining, start, end, progressLabel = "Snippet progress", className }) {
		const p = progress == null ? null : Math.max(0, Math.min(1, progress));
		const el = typeof elapsed === "number" ? formatTime(elapsed) : elapsed;
		const rem = typeof remaining === "number" ? formatTime(-Math.abs(remaining)) : remaining;
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-lcd", className),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "sq-lcd-side",
					children: start
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "sq-lcd-body",
					children: [
						title != null ? /* @__PURE__ */ jsx("div", {
							className: "sq-lcd-title",
							children: title
						}) : null,
						subtitle != null ? /* @__PURE__ */ jsx("div", {
							className: "sq-lcd-subtitle",
							children: subtitle
						}) : null,
						p != null ? /* @__PURE__ */ jsxs("div", {
							className: "sq-lcd-progress",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "sq-lcd-time sq-lcd-elapsed",
									children: el
								}),
								/* @__PURE__ */ jsx("div", {
									className: "sq-lcd-track",
									role: "progressbar",
									"aria-label": progressLabel,
									"aria-valuemin": 0,
									"aria-valuemax": 100,
									"aria-valuenow": Math.round(p * 100),
									children: /* @__PURE__ */ jsx("div", {
										className: "sq-lcd-fill",
										style: { width: p * 100 + "%" }
									})
								}),
								/* @__PURE__ */ jsx("span", {
									className: "sq-lcd-time",
									children: rem
								})
							]
						}) : null
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-lcd-side",
					children: end
				})
			]
		});
	}
	//#endregion
	//#region design-system/project/components/src/Controls.tsx
	function SegmentedControl({ options, value, defaultValue, onChange, label, className }) {
		const opts = options.map((o) => typeof o === "string" ? {
			value: o,
			label: o
		} : o);
		const [current, setCurrent] = useMaybeControlled(value, defaultValue ?? opts[0]?.value ?? "", onChange);
		return /* @__PURE__ */ jsx("div", {
			className: cx("sq-segmented", className),
			role: "radiogroup",
			"aria-label": label,
			children: opts.map((o) => {
				const on = o.value === current;
				const name = o.label ? void 0 : o.title ?? o.value;
				return /* @__PURE__ */ jsxs("button", {
					type: "button",
					role: "radio",
					"aria-checked": on,
					"aria-label": name,
					title: name,
					className: cx("sq-seg", on && "is-on", !o.label && "sq-seg-icon"),
					onClick: () => setCurrent(o.value),
					children: [o.icon ? /* @__PURE__ */ jsx(Icon, {
						name: o.icon,
						size: 12
					}) : null, o.label ? /* @__PURE__ */ jsx("span", { children: o.label }) : null]
				}, o.value);
			})
		});
	}
	function SearchField({ value, defaultValue = "", onChange, onSubmit, placeholder = "Search", size = "md", icon = "search", label, disabled, autoFocus, className }) {
		const [current, setCurrent] = useMaybeControlled(value, defaultValue, onChange);
		return /* @__PURE__ */ jsxs("form", {
			className: cx("sq-search", "sq-search-" + size, className),
			role: "search",
			onSubmit: (e) => {
				e.preventDefault();
				onSubmit?.(current);
			},
			children: [
				/* @__PURE__ */ jsx(Icon, {
					name: icon,
					size: size === "lg" ? 16 : 12
				}),
				/* @__PURE__ */ jsx("input", {
					type: "text",
					value: current,
					placeholder,
					"aria-label": label ?? placeholder,
					autoComplete: "off",
					spellCheck: false,
					disabled,
					autoFocus,
					onChange: (e) => setCurrent(e.target.value)
				}),
				current && !disabled ? /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "sq-search-clear",
					"aria-label": "Clear",
					onClick: () => setCurrent(""),
					children: /* @__PURE__ */ jsx(Icon, {
						name: "cross",
						size: 8
					})
				}) : null
			]
		});
	}
	function Button({ children, variant = "default", size = "md", icon, onClick, disabled, type = "button", title, className }) {
		return /* @__PURE__ */ jsxs("button", {
			type,
			disabled,
			onClick,
			title,
			className: cx("sq-btn", "sq-btn-" + variant, "sq-btn-" + size, className),
			children: [icon ? /* @__PURE__ */ jsx(Icon, {
				name: icon,
				size: size === "lg" ? 14 : 12
			}) : null, children != null ? /* @__PURE__ */ jsx("span", { children }) : null]
		});
	}
	//#endregion
	//#region design-system/project/components/src/SourceList.tsx
	function SourceList({ sections, selected, onSelect, label = "Sidebar", className }) {
		const [closed, setClosed] = (0, react.useState)({});
		return /* @__PURE__ */ jsx("nav", {
			className: cx("sq-source", className),
			"aria-label": label,
			children: sections.map((section, i) => {
				const key = section.title ?? String(i);
				const isClosed = closed[key] ?? !!section.collapsed;
				const toggle = () => setClosed({
					...closed,
					[key]: !isClosed
				});
				let heading = null;
				if (section.title != null) heading = section.collapsible ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "sq-source-heading",
					"aria-expanded": !isClosed,
					onClick: toggle,
					children: [/* @__PURE__ */ jsx(Icon, {
						name: isClosed ? "disclosure" : "disclosure-down",
						size: 8
					}), section.title]
				}) : /* @__PURE__ */ jsx("div", {
					className: "sq-source-heading",
					children: section.title
				});
				return /* @__PURE__ */ jsxs("div", {
					className: "sq-source-section",
					children: [heading, isClosed ? null : /* @__PURE__ */ jsx("ul", {
						className: "sq-source-items",
						children: section.items.map((item) => {
							const on = item.id === selected;
							return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: cx("sq-source-item", on && "is-on"),
								"aria-current": on ? "true" : void 0,
								onClick: () => onSelect?.(item.id),
								children: [
									item.icon ? /* @__PURE__ */ jsx(Icon, {
										name: item.icon,
										size: 16
									}) : null,
									/* @__PURE__ */ jsx("span", {
										className: "sq-source-label",
										children: item.label
									}),
									item.badge != null ? /* @__PURE__ */ jsx("span", {
										className: "sq-count",
										children: item.badge
									}) : null
								]
							}) }, item.id);
						})
					})]
				}, key);
			})
		});
	}
	//#endregion
	//#region design-system/project/components/src/Status.tsx
	var BADGE_ICON = {
		correct: "check",
		wrong: "cross",
		gold: "trophy"
	};
	function Badge({ children, tone = "neutral", icon, className }) {
		const glyph = icon === void 0 ? BADGE_ICON[tone] : icon;
		return /* @__PURE__ */ jsxs("span", {
			className: cx("sq-badge", "sq-badge-" + tone, className),
			children: [glyph ? /* @__PURE__ */ jsx(Icon, {
				name: glyph,
				size: 9
			}) : null, children]
		});
	}
	var PLAYER_STATUS = {
		guessing: ["neutral", "Guessing"],
		locked: ["aqua", "Locked in"],
		correct: ["correct", "Correct"],
		wrong: ["wrong", "Wrong"],
		away: ["neutral", "Away"]
	};
	function Leaderboard({ players, highlight, caption, sort = true, locale = "en-US", className }) {
		const rows = players.slice();
		if (sort) rows.sort((a, b) => (b.score || 0) - (a.score || 0));
		const nf = new Intl.NumberFormat(locale);
		return /* @__PURE__ */ jsxs("table", {
			className: cx("sq-list", className),
			children: [
				caption ? /* @__PURE__ */ jsx("caption", {
					className: "sq-visually-hidden",
					children: caption
				}) : null,
				/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
					/* @__PURE__ */ jsx("th", {
						scope: "col",
						className: "sq-col-rank",
						children: "#"
					}),
					/* @__PURE__ */ jsx("th", {
						scope: "col",
						children: "Player"
					}),
					/* @__PURE__ */ jsx("th", {
						scope: "col",
						className: "sq-col-status",
						children: "Status"
					}),
					/* @__PURE__ */ jsx("th", {
						scope: "col",
						className: "sq-col-num",
						children: "Streak"
					}),
					/* @__PURE__ */ jsx("th", {
						scope: "col",
						className: "sq-col-num is-sorted",
						"aria-sort": sort ? "descending" : void 0,
						children: "Score"
					})
				] }) }),
				/* @__PURE__ */ jsx("tbody", { children: rows.map((p, i) => {
					const status = p.status ? PLAYER_STATUS[p.status] : null;
					return /* @__PURE__ */ jsxs("tr", {
						className: p.id === highlight ? "is-on" : void 0,
						children: [
							/* @__PURE__ */ jsx("td", {
								className: "sq-col-rank",
								children: i === 0 && p.score > 0 ? /* @__PURE__ */ jsx(Badge, {
									tone: "gold",
									children: "1"
								}) : i + 1
							}),
							/* @__PURE__ */ jsxs("td", {
								className: "sq-col-name",
								children: [p.name, p.note ? /* @__PURE__ */ jsx("span", {
									className: "sq-list-note",
									children: " " + p.note
								}) : null]
							}),
							/* @__PURE__ */ jsx("td", {
								className: "sq-col-status",
								children: status ? /* @__PURE__ */ jsx(Badge, {
									tone: status[0],
									children: status[1]
								}) : null
							}),
							/* @__PURE__ */ jsx("td", {
								className: "sq-col-num",
								children: p.streak ? p.streak + "×" : "–"
							}),
							/* @__PURE__ */ jsxs("td", {
								className: "sq-col-num",
								children: [p.delta ? /* @__PURE__ */ jsx("span", {
									className: "sq-delta",
									children: "+" + nf.format(p.delta)
								}) : null, nf.format(p.score || 0)]
							})
						]
					}, p.id);
				}) })
			]
		});
	}
	function BarButton({ icon, label, active, onClick, disabled, className }) {
		return /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick,
			disabled,
			"aria-label": label,
			title: label,
			"aria-pressed": active == null ? void 0 : !!active,
			className: cx("sq-barbtn", active && "is-on", className),
			children: /* @__PURE__ */ jsx(Icon, {
				name: icon,
				size: 12
			})
		});
	}
	function StatusBar({ children, start, end, className }) {
		return /* @__PURE__ */ jsxs("div", {
			className: cx("sq-statusbar", className),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "sq-statusbar-start",
					children: start
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-statusbar-text",
					"aria-live": "polite",
					children
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-statusbar-end",
					children: end
				})
			]
		});
	}
	//#endregion
	//#region design-system/project/components/src/Album.tsx
	/** Placeholder art: a silver sleeve with a record, or a dark sleeve with "?" while hidden. */
	function Sleeve({ hidden }) {
		return hidden ? /* @__PURE__ */ jsx("span", {
			className: "sq-sleeve sq-sleeve-hidden",
			"aria-hidden": true,
			children: "?"
		}) : /* @__PURE__ */ jsx("span", {
			className: "sq-sleeve",
			"aria-hidden": true
		});
	}
	var artSize = (size) => size ? { "--sq-art": size + "px" } : void 0;
	function AlbumGrid({ children, label, size, className }) {
		return /* @__PURE__ */ jsx("div", {
			className: cx("sq-grid", className),
			role: "list",
			"aria-label": label,
			style: artSize(size),
			children: react.Children.map(children, (child) => child ? /* @__PURE__ */ jsx("div", {
				role: "listitem",
				className: "sq-grid-cell",
				children: child
			}) : null)
		});
	}
	var STATE_BADGE = {
		correct: ["correct", "Correct"],
		wrong: ["wrong", "Wrong"]
	};
	function AlbumTile({ art, title, subtitle, state = "idle", playing, onClick, disabled, size, badgeLabel, className }) {
		const hidden = state === "hidden";
		const badge = STATE_BADGE[state];
		const content = /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("span", {
				className: "sq-tile-art",
				children: [hidden || !art ? /* @__PURE__ */ jsx(Sleeve, { hidden }) : /* @__PURE__ */ jsx("img", {
					src: art,
					alt: "",
					loading: "lazy"
				}), badge ? /* @__PURE__ */ jsx("span", {
					className: "sq-tile-badge",
					children: /* @__PURE__ */ jsx(Badge, {
						tone: badge[0],
						children: badgeLabel ?? badge[1]
					})
				}) : null]
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "sq-tile-title",
				children: [playing ? /* @__PURE__ */ jsx(Icon, {
					name: "volume-high",
					size: 10,
					title: "Playing"
				}) : null, /* @__PURE__ */ jsx("span", {
					className: "sq-ellipsis",
					children: title
				})]
			}),
			subtitle != null ? /* @__PURE__ */ jsx("span", {
				className: "sq-tile-subtitle sq-ellipsis",
				children: subtitle
			}) : null
		] });
		const classes = cx("sq-tile", "is-" + state, className);
		return onClick ? /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick,
			disabled,
			"aria-pressed": state === "selected",
			className: classes,
			style: artSize(size),
			children: content
		}) : /* @__PURE__ */ jsx("div", {
			className: classes,
			style: artSize(size),
			children: content
		});
	}
	function NowPlaying({ label = "Now Playing", art, title, subtitle, hidden, className }) {
		return /* @__PURE__ */ jsxs("section", {
			className: cx("sq-nowplaying", className),
			"aria-label": label,
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "sq-nowplaying-head",
					children: [/* @__PURE__ */ jsx(Icon, {
						name: "play",
						size: 8
					}), label]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "sq-nowplaying-art",
					children: hidden || !art ? /* @__PURE__ */ jsx(Sleeve, { hidden }) : /* @__PURE__ */ jsx("img", {
						src: art,
						alt: title ? "Cover of " + title : ""
					})
				}),
				title || subtitle ? /* @__PURE__ */ jsxs("div", {
					className: "sq-nowplaying-caption",
					children: [title ? /* @__PURE__ */ jsx("div", {
						className: "sq-nowplaying-title sq-ellipsis",
						children: title
					}) : null, subtitle ? /* @__PURE__ */ jsx("div", {
						className: "sq-nowplaying-subtitle sq-ellipsis",
						children: subtitle
					}) : null]
				}) : null
			]
		});
	}
	//#endregion
	exports.AlbumGrid = AlbumGrid;
	exports.AlbumTile = AlbumTile;
	exports.Badge = Badge;
	exports.BarButton = BarButton;
	exports.Button = Button;
	exports.Icon = Icon;
	exports.LcdDisplay = LcdDisplay;
	exports.Leaderboard = Leaderboard;
	exports.NowPlaying = NowPlaying;
	exports.SearchField = SearchField;
	exports.SegmentedControl = SegmentedControl;
	exports.SourceList = SourceList;
	exports.StatusBar = StatusBar;
	exports.Toolbar = Toolbar;
	exports.Transport = Transport;
	exports.TransportButton = TransportButton;
	exports.VolumeSlider = VolumeSlider;
	exports.Window = Window;
	exports.formatTime = formatTime;
	exports.iconNames = iconNames;
	return exports;
})({}, React);
