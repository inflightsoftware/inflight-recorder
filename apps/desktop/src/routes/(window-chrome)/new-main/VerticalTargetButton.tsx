import { cx } from "cva";
import { type Component, type ComponentProps, createSignal, splitProps } from "solid-js";
import { RecordFill } from "~/icons";

type VerticalTargetButtonProps = {
	selected: boolean;
	Component: Component<ComponentProps<"svg">>;
	name: string;
	disabled?: boolean;
} & ComponentProps<"button">;

function VerticalTargetButton(props: VerticalTargetButtonProps) {
	const [local, rest] = splitProps(props, [
		"selected",
		"Component",
		"name",
		"disabled",
		"class",
	]);

	const [hovered, setHovered] = createSignal(false);

	return (
		<button
			{...rest}
			type="button"
			disabled={local.disabled}
			aria-pressed={local.selected ? "true" : "false"}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			class={cx(
				"group flex w-full flex-col items-center gap-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-9 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-1",
				"rounded-[10px] border",
				local.selected
					? "border-[#1C8AF8]/40 bg-[#1C8AF8]/20 text-gray-12"
					: hovered()
						? "border-white/10 bg-[#1C8AF8]/20 text-gray-12"
						: "border-white/10 bg-white/[0.05] text-gray-12",
				local.disabled && "pointer-events-none opacity-60",
				local.class,
			)}
			style={{
				"box-shadow": "0 1px 1px -0.5px rgba(0, 0, 0, 0.16)",
			}}
		>
			<div class="relative size-5 flex-shrink-0 items-center justify-center pointer-events-none">
				<local.Component
					class={cx(
						"absolute inset-0 size-5 pointer-events-none transition-opacity duration-200",
						local.selected ? "text-gray-12" : "text-gray-9",
						hovered() && "opacity-0",
					)}
				/>
				<RecordFill
					class={cx(
						"absolute inset-0 size-5 transition-opacity duration-200 text-[#60ADFA] pointer-events-none",
						hovered() ? "opacity-100" : "opacity-0",
					)}
				/>
			</div>
			<p class="text-xs font-medium text-white">{local.name}</p>
		</button>
	);
}

export default VerticalTargetButton;
