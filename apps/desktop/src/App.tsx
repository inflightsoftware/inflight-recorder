import { Router, useCurrentMatches } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { getCurrentWebviewWindow, type WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { message } from "@tauri-apps/plugin-dialog";
import { createEffect, onCleanup, onMount, Suspense } from "solid-js";
import toast, { Toaster } from "solid-toast";

import "@inflight/ui-solid/main.css";
import "unfonts.css";
import "./styles/theme.css";

import { CapErrorBoundary } from "./components/CapErrorBoundary";
import { generalSettingsStore } from "./store";
import { initAnonymousUser } from "./utils/analytics";
import { createTauriEventListener } from "./utils/createEventListener";
import { type AppTheme, commands, events } from "./utils/tauri";
import titlebar from "./utils/titlebar-state";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		},
		mutations: {
			onError: (e) => {
				message(`Error\n${e}`);
			},
		},
	},
});

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Suspense>
				<Inner />
			</Suspense>
		</QueryClientProvider>
	);
}

function Inner() {
	const currentWindow = getCurrentWebviewWindow();
	createThemeListener(currentWindow);

	onMount(() => {
		initAnonymousUser();
	});

	createTauriEventListener(events.newNotification, (payload) => {
		if (payload.is_error) {
			toast.error(payload.body, {
				style: {
					background: "#FEE2E2",
					color: "#991B1B",
					border: "1px solid #F87171",
				},
				iconTheme: {
					primary: "#991B1B",
					secondary: "#FEE2E2",
				},
			});
		} else {
			toast.success(payload.body);
		}
	});

	return (
		<>
			<Toaster
				position="top-center"
				containerStyle={{
					"margin-top": 0,
				}}
				toastOptions={{
					duration: 3500,
					style: {
						padding: "8px 16px",
						"border-radius": "15px",
						"border-color": "var(--gray-200)",
						"border-width": "1px",
						"font-size": "0.8125rem",
						"background-color": "var(--gray-50)",
						color: "var(--text-secondary)",
					},
				}}
			/>
			<CapErrorBoundary>
				<Router
					root={(props) => {
						const matches = useCurrentMatches();

						onMount(() => {
							for (const match of matches()) {
								if (match.route.info?.AUTO_SHOW_WINDOW === false) return;
							}

							if (location.pathname !== "/camera") currentWindow.show();
						});

						return (
							<Suspense
								fallback={
									(() => {
										console.log("Root suspense fallback showing");
									}) as any
								}
							>
								{props.children}
							</Suspense>
						);
					}}
				>
					<FileRoutes />
				</Router>
			</CapErrorBoundary>
		</>
	);
}

function createThemeListener(currentWindow: WebviewWindow) {
	const generalSettings = generalSettingsStore.createQuery();

	createEffect(() => {
		update(generalSettings.data?.theme ?? null);
	});

	onMount(async () => {
		const unlisten = await currentWindow.onThemeChanged((_) => update(generalSettings.data?.theme));
		onCleanup(() => unlisten?.());
	});

	function update(appTheme: AppTheme | null | undefined) {
		if (location.pathname === "/camera") return;

		if (appTheme === undefined || appTheme === null) return;

		commands.setTheme(appTheme).then(() => {
			document.documentElement.classList.toggle(
				"dark",
				appTheme === "dark" || window.matchMedia("(prefers-color-scheme: dark)").matches,
			);
		});
	}
}
