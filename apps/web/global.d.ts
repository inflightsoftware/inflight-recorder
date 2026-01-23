declare type MaybePromise<T> = T | Promise<T>;

declare type DistributiveOmit<T, K extends keyof any> = T extends any
	? Omit<T, K>
	: never;

type ExtractParams<T extends string> =
	T extends `${infer _Start}[${infer Param}]${infer Rest}`
		? { [K in Param | keyof ExtractParams<Rest>]: string }
		: {};

type ExtractSearchParams<T extends string> =
	T extends `${infer _Path}?${infer _Query}`
		? { [key: string]: string | string[] | undefined }
		: { [key: string]: string | string[] | undefined };

declare type PageProps<T extends string = string> = {
	params: Promise<ExtractParams<T>>;
	searchParams: Promise<ExtractSearchParams<T>>;
};

declare type RouteContext<T extends string = string> = {
	params: Promise<ExtractParams<T>>;
};
