const DOMAIN_PATTERN = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function validateDomain(domain: string): string {
	const sanitized = domain.toLowerCase().trim();
	if (!DOMAIN_PATTERN.test(sanitized)) {
		throw new Error("Invalid domain format");
	}
	return encodeURIComponent(sanitized);
}

export const getConfigResponse = async (domain: string) => {
	const safeDomain = validateDomain(domain);
	const response = await fetch(
		`https://api.vercel.com/v6/domains/${safeDomain}/config?teamId=${
			process.env.VERCEL_TEAM_ID
		}&strict=true`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		},
	).then((res) => res.json());
	return response;
};

export const getDomainResponse = async (domain: string) => {
	const safeDomain = validateDomain(domain);
	const response = await fetch(
		`https://api.vercel.com/v9/projects/${
			process.env.VERCEL_PROJECT_ID
		}/domains/${safeDomain}?teamId=${process.env.VERCEL_TEAM_ID}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		},
	).then((res) => res.json());
	return response;
};

export const verifyDomain = async (domain: string) => {
	const safeDomain = validateDomain(domain);
	const response = await fetch(
		`https://api.vercel.com/v9/projects/${
			process.env.VERCEL_PROJECT_ID
		}/domains/${safeDomain}/verify?teamId=${
			process.env.VERCEL_TEAM_ID
		}&strict=true`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
				"Content-Type": "application/json",
			},
		},
	).then((res) => res.json());
	return response;
};

export const addDomain = async (domain: string) => {
	const safeDomain = validateDomain(domain);
	const response = await fetch(
		`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: safeDomain }),
			cache: "no-store",
		},
	).then((res) => res.json());

	return response;
};

export const getRequiredConfig = async (domain: string) => {
	const safeDomain = validateDomain(domain);
	try {
		const recordsResponse = await fetch(
			`https://api.vercel.com/v4/domains/${safeDomain}/records?limit=10&teamId=${
				process.env.VERCEL_TEAM_ID
			}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			},
		).then((res) => res.json());

		if (recordsResponse.records) {
			const aRecord = recordsResponse.records.find(
				(record: any) => record.type === "A" && record.name === "",
			);

			if (aRecord) {
				return {
					configuredBy: "vercel",
					aValues: [aRecord.value],
					serviceType: "vercel",
				};
			}
		}
	} catch (_error) {
		// Continue to fallback
	}

	const response = await fetch(
		`https://api.vercel.com/v6/domains/${safeDomain}/config?teamId=${
			process.env.VERCEL_TEAM_ID
		}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		},
	).then((res) => res.json());

	// If we still don't have the A record, try the project domains endpoint
	if (!response.aValues || response.aValues.length === 0) {
		const projectResponse = await fetch(
			`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			},
		).then((res) => res.json());

		if (projectResponse.domains) {
			const projectDomain = projectResponse.domains.find(
				(d: any) => d.name === safeDomain,
			);
			if (projectDomain?.apexValue) {
				response.aValues = [projectDomain.apexValue];
			}
		}
	}

	return response;
};

export const checkDomainStatus = async (domain: string) => {
	try {
		const [domainJson, configJson, requiredConfigJson] = await Promise.all([
			getDomainResponse(domain),
			getConfigResponse(domain),
			getRequiredConfig(domain),
		]);

		let verified = false;

		if (configJson.misconfigured || domainJson?.error?.code === "not_found") {
			verified = false;
		} else if (domainJson.verified) {
			verified = true;
		} else {
			const verificationJson = await verifyDomain(domain);
			verified = verificationJson?.verified;
		}

		// Get the current and required A records
		const currentAValues = configJson.aValues || [];
		const requiredAValue = requiredConfigJson.aValues?.[0];

		return {
			verified,
			config: {
				...configJson,
				verification: domainJson?.verification || [],
				currentAValues,
				requiredAValue,
			},
			status: domainJson,
		};
	} catch (_error) {
		return {
			verified: false,
			error: "Failed to check domain status",
		};
	}
};
